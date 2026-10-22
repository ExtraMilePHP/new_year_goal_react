import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import { apiPost } from '../../../utils/apiClient';
import { readCookie, writeGettime, writeLastStage } from '../../../utils/santaCookies';
import { startSantaStage, submitSantaStage } from '../../../utils/roundSave';
import { SANTA, SANTA_PAGE_BG, STAGE_HINTS, STAGE_NEXT, fieldsForStage } from '../../../data/santaStages';
import './StagePage.css';

const FIELD_STYLE = {
  ok: { backgroundColor: 'green', color: 'white' },
  bad: { backgroundColor: 'red', color: 'white' },
  empty: { backgroundColor: 'white', color: 'black' },
};

function formatClock(minutes, seconds) {
  const mm = minutes ? (minutes > 9 ? minutes : `0${minutes}`) : '00';
  const ss = seconds > 9 ? seconds : `0${seconds}`;
  return `${mm}:${ss}`;
}

function HintModal({ text, onClose }) {
  return (
    <div className="santa-hint-backdrop" onClick={onClose}>
      <div className="santa-hint-card" role="dialog" aria-label="Hint" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="santa-hint-close" onClick={onClose} aria-label="Close">×</button>
        <h3 className="santa-hint-title">HINT</h3>
        <div className="santa-hint-copy">
          {text.split('\n').map((line, index) => (
            <React.Fragment key={index}>
              {line}
              {index < text.split('\n').length - 1 ? <br /> : null}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnswerInput({ field, color, readOnly, onKeyUp, onFocus, onBlur, style }) {
  return (
    <input
      type="text"
      name={field.id}
      id={field.id}
      className="input-text"
      autoComplete="off"
      required
      readOnly={readOnly}
      style={{ ...style, ...(FIELD_STYLE[color] || null) }}
      onKeyUp={onKeyUp}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
}

export default function StagePage({ stage }) {
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const fields = fieldsForStage(stage);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [hintOpen, setHintOpen] = useState(false);
  const [points, setPoints] = useState(stage === 1 ? 0 : null);
  const [clock, setClock] = useState('');
  const [colors, setColors] = useState({});
  const [locked, setLocked] = useState({});
  const [saving, setSaving] = useState(false);
  const timerRef = useRef({ hours: 0, minutes: 0, seconds: 0 });
  const clockRef = useRef('');
  const focusValue = useRef({});

  useEffect(() => {
    if (!user?.userId) return undefined;
    let cancelled = false;
    (async () => {
      try {
        if (stage === 1) await startSantaStage(user);
        const res = await apiPost('/game/status', {
          userId: user.userId,
          stage,
          gettime: readCookie('gettime'),
          lastStage: readCookie('last_stage'),
        });
        if (cancelled) return;
        if (res.timer) {
          writeGettime(res.timer.gettime);
          writeLastStage(res.timer.lastStage);
          timerRef.current = {
            hours: Number(res.timer.hours) || 0,
            minutes: Number(res.timer.minutes) || 0,
            seconds: Number(res.timer.seconds) || 0,
          };
        }
        setPoints(stage === 1 ? 0 : Number(res.totalScore) || 0);
        if (res.redirectTo) {
          navigate(res.redirectTo, { replace: true });
          return;
        }
        setReady(true);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError('Unable to load the game. Please refresh.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, stage, navigate]);

  useEffect(() => {
    if (!ready) return undefined;
    const id = setInterval(() => {
      let { seconds, minutes, hours } = timerRef.current;
      seconds += 1;
      if (seconds >= 60) {
        seconds = 0;
        minutes += 1;
        if (minutes >= 60) {
          minutes = 0;
          hours += 1;
        }
      }
      timerRef.current = { seconds, minutes, hours };
      const target = formatClock(minutes, seconds);
      clockRef.current = target;
      setClock(target);
    }, 1000);
    return () => clearInterval(id);
  }, [ready]);

  const paint = (id, kind) => setColors((prev) => ({ ...prev, [id]: kind }));

  const onKeyUp = (field) => (event) => {
    const trimmed = event.target.value.trim();
    if (trimmed === '') {
      event.target.value = '';
      paint(field.id, 'empty');
      return;
    }
    if (field.keyCheck(trimmed)) {
      paint(field.id, 'ok');
      setLocked((prev) => ({ ...prev, [field.id]: true }));
    } else {
      paint(field.id, 'bad');
    }
  };

  const onFocus = (field) => (event) => {
    focusValue.current[field.id] = event.target.value;
  };

  const onBlur = (field) => (event) => {
    const raw = event.target.value;
    if (raw === focusValue.current[field.id]) return;
    if (field.clearBlankOnChange && raw.trim() === '') {
      event.target.value = '';
      paint(field.id, 'empty');
      return;
    }
    if (!field.clearBlankOnChange && raw === '') {
      paint(field.id, 'empty');
      return;
    }
    if (field.changeCheck(raw)) setPoints((prev) => (Number(prev) || 0) + 1);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const answers = {};
    fields.forEach((field) => {
      const input = form.elements[field.id];
      answers[field.id] = input ? input.value : '';
    });
    setSaving(true);
    try {
      await submitSantaStage({
        user,
        question: stage,
        timer: clockRef.current,
        answers,
        navigate,
        nextPath: STAGE_NEXT[stage],
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        text: 'Unable to save your answer. Please try again.',
        icon: 'error',
        confirmButtonText: 'Close',
        customClass: { confirmButton: 'hf-swal-close', popup: 'hf-swal-popup' },
        buttonsStyling: false,
      });
    } finally {
      setSaving(false);
    }
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  };

  if (error) {
    return <div className="santa-stage santa-message" style={SANTA_PAGE_BG}>{error}</div>;
  }
  if (!ready) {
    return <div className="santa-stage santa-message" style={SANTA_PAGE_BG}>Loading…</div>;
  }

  const hint = STAGE_HINTS[stage];

  return (
    <div className={`santa-stage santa-stage-${stage}`} style={SANTA_PAGE_BG}>
      <div className="container-fluid santa-toolbar">
        <div className="row">
          <div className="col-sm-4 col-md-4 col-lg-4 col-xs-8 santa-toolbar-left">
            <div className="timer-back" id="timer1">{clock ? `Time: ${clock}` : 'Time : 00'}</div>
            <button type="button" className="santa-hint-btn" id="hint" onClick={() => setHintOpen(true)}>HINT</button>
          </div>
          <div className="col-sm-2 col-md-2 col-lg-2 col-xs-4 santa-toolbar-right">
            <div className="score">Points : <span id="scoreid">{points == null ? 0 : points}</span></div>
          </div>
        </div>
      </div>

      <form id="formdata" onSubmit={onSubmit} onKeyDown={onKeyDown}>
        <input type="hidden" name="timer" id="time" value={clock} readOnly />
        {stage === 1 ? <StageOne fields={fields} colors={colors} locked={locked} onKeyUp={onKeyUp} onFocus={onFocus} onBlur={onBlur} saving={saving} /> : null}
        {stage === 2 ? <StageTwo fields={fields} colors={colors} locked={locked} onKeyUp={onKeyUp} onFocus={onFocus} onBlur={onBlur} saving={saving} /> : null}
        {stage === 3 ? <StageThree fields={fields} colors={colors} locked={locked} onKeyUp={onKeyUp} onFocus={onFocus} onBlur={onBlur} saving={saving} /> : null}
        {stage === 4 ? <StageFour fields={fields} colors={colors} locked={locked} onKeyUp={onKeyUp} onFocus={onFocus} onBlur={onBlur} saving={saving} /> : null}
      </form>

      {hintOpen ? <HintModal text={hint} onClose={() => setHintOpen(false)} /> : null}
    </div>
  );
}

function StageOne({ fields, colors, locked, onKeyUp, onFocus, onBlur, saving }) {
  const field = fields[0];
  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-sm-12 col-md-12 col-lg-12 col-xs-12 auto">
          <div className="col-sm-5 col-md-4 col-lg-4 col-xs-12 mob">
            <div className="col-sm-12 col-md-11 col-lg-11 col-xs-12 auto">
              <img src={`${SANTA}/right-santa.png`} alt="" style={{ width: '100%' }} />
            </div>
          </div>
          <div className="col-sm-7 col-md-8 col-lg-8 col-xs-12 maincontent1">
            <div className="col-sm-11 col-md-11 col-lg-11 col-xs-12 auto">
              <h3 className="log-title">
                Santa has begun the journey from NORTHPOLE.<br />The first pit-stop is the dark skies of North America.
              </h3>
              <h3 className="log-title">
                It is extremely cold, windy, and chilly. Santa needs to get to 4 homes and deliver the presents to the kids who have been SUPER NICE.
              </h3>
              <div className="game-title1 log-title">
                Insert the key to help Santa move forward:<br />
                <AnswerInput field={field} color={colors[field.id]} readOnly={locked[field.id]} onKeyUp={onKeyUp(field)} onFocus={onFocus(field)} onBlur={onBlur(field)} />
              </div>
            </div>
            <div className="row show-btn">
              <div className="col-sm-3 col-md-3 col-lg-3 col-xs-7 auto">
                <input type="submit" value="SUBMIT" className="button-login santa-submit" disabled={saving} />
              </div>
            </div>
          </div>
          <div className="col-sm-5 col-md-4 col-lg-4 col-xs-12 desk">
            <div className="col-sm-12 col-md-11 col-lg-11 col-xs-12 auto">
              <img src={`${SANTA}/right-santa.png`} alt="" style={{ width: '100%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StageTwo({ fields, colors, locked, onKeyUp, onFocus, onBlur, saving }) {
  const left = fields.slice(0, 3);
  const right = fields.slice(3);
  const renderField = (field) => (
    <div className="col-sm-12 col-md-12 col-lg-12 col-xs-12 form-group game-title1" key={field.id}>
      <label className="control-label col-sm-6 col-md-7 col-lg-7 col-xs-12" htmlFor={field.id}>{field.label}</label>
      <div className="col-sm-6 col-md-5 col-lg-5 col-xs-12 santa-input-col">
        <AnswerInput
          field={field}
          color={colors[field.id]}
          readOnly={locked[field.id]}
          onKeyUp={onKeyUp(field)}
          onFocus={onFocus(field)}
          onBlur={onBlur(field)}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-sm-10 col-md-10 col-lg-10 col-xs-12 auto">
          <h3 className="log-title">
            <b>Congratulations! Thank you for helping Santa with the first delivery. Let&apos;s now fly across the Atlantic Ocean to Africa. The children can&apos;t wait to get their presents. Unfortunately. Santa is unable to understand the language!</b>
          </h3>
          <h3 className="log-title">Help Santa decode the Gibberish and deliver all 6 presents to the little ones.</h3>
        </div>
      </div>
      <div className="row santa-stage2-fields">
        <div className="col-sm-12 col-md-10 col-lg-10 col-xs-12 auto">
          <div className="col-sm-6 col-md-6 col-lg-6 col-xs-12">{left.map(renderField)}</div>
          <div className="col-sm-6 col-md-6 col-lg-6 col-xs-12">{right.map(renderField)}</div>
        </div>
      </div>
      <div className="row show-btn">
        <div className="col-sm-2 col-md-2 col-lg-2 col-xs-6 auto">
          <input type="submit" value="Submit" className="button-login santa-submit" disabled={saving} />
        </div>
      </div>
      <div className="row">
        <div className="col-sm-12 col-md-11 col-lg-11 col-xs-12 mob">
          <img src={`${SANTA}/Screen3_Character.png`} alt="" style={{ width: '100%', marginTop: 20 }} />
        </div>
      </div>
    </div>
  );
}

function StageThree({ fields, colors, locked, onKeyUp, onFocus, onBlur, saving }) {
  const field = fields[0];
  return (
    <div className="container-fluid">
      <div className="santa-stage3-layout">
        <div className="santa-stage3-copy">
          <h3 className="log-title santa-left">
            Cheers to you! You have only 1 more pit-stops to complete Santa&apos;s adventure across the globe. You now move towards ASIA.
          </h3>
          <h3 className="log-title santa-left">
            There are so many kids to make happy. But SANTA only has few elves. Help SANTA recruit the right number of ELVES to make the distribution quicker and smoother.
          </h3>
          <div className="game-title1 log-title santa-stage3-answer">
            Insert the number of elves needed to help SANTA move forward: <br />
            <AnswerInput
              field={field}
              color={colors[field.id]}
              readOnly={locked[field.id]}
              onKeyUp={onKeyUp(field)}
              onFocus={onFocus(field)}
              onBlur={onBlur(field)}
              style={{ textAlign: 'center', width: 100 }}
            />
          </div>
          <div className="santa-stage3-submit">
            <input type="submit" value="Submit" className="button-login santa-submit" disabled={saving} />
          </div>
        </div>
        <div className="santa-stage3-wheel">
          <img src={`${SANTA}/wheel.png`} alt="" />
        </div>
      </div>
    </div>
  );
}

function StageFour({ fields, colors, locked, onKeyUp, onFocus, onBlur, saving }) {
  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-sm-8 col-md-8 col-lg-8 col-xs-12 auto">
          <h3 className="log-title">
            You are simply unstoppable! The last stop awaits and so do the eager children in Australia. Alas, SANTA realises that the elves have coded the gifts so the children can have some fun. Can you decode the names so they can be distributed right?
          </h3>
        </div>
      </div>
      <div className="santa-rebus-row">
        {fields.map((field) => (
          <div className="santa-rebus" key={field.id}>
            <img src={`${SANTA}/${field.image}`} alt="" />
            <AnswerInput
              field={field}
              color={colors[field.id]}
              readOnly={locked[field.id]}
              onKeyUp={onKeyUp(field)}
              onFocus={onFocus(field)}
              onBlur={onBlur(field)}
              style={{ width: '100%', boxSizing: 'border-box', display: 'block' }}
            />
          </div>
        ))}
      </div>
      <div className="row show-btn">
        <div className="col-sm-2 col-md-2 col-lg-2 col-xs-6 auto">
          <input type="submit" value="SUBMIT" className="button-login santa-submit" disabled={saving} />
        </div>
      </div>
    </div>
  );
}
