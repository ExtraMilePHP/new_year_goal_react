import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import useBlockInspect from '../../hooks/useBlockInspect';
import { apiPost } from '../../utils/apiClient';
import { isDemoUser, ucfirst, ucwords } from '../../utils/user';
import { createPostReport, updatePostReportPoints } from '../../functions/newYearReport';
import { ECARDS, EMAIL_RE, NY, OTHERS_ECARD, plansUrl } from '../../data/newYear';
import EmPopup from './EmPopup';
import './GamePage.css';

const stripLeadingSpaces = (value) => value.replace(/^\s+/, '');

function initialForm(user) {
  return { name: user?.firstName || user?.name || '', ecard: ECARDS[0].value, goal: '', email: '', message: '' };
}

function PostCard({ post, onLike, onDelete }) {
  const isOthers = (post.ecardName || '').trim() === 'OTHERS';

  return (
    <div className="col-xs-12 col-sm-3 col-md-3 col-lg-3 video-container" style={{ position: 'relative' }}>
      <img
        src={`${NY}/images/${post.ecard}?v=1`}
        className="image-fix"
        alt=""
        style={{ position: 'relative', width: '100%', height: 'auto', left: '0%', border: '4px solid #cfc065' }}
      />
      <div className="col-md-12 operation">
        <div className="col-md-12 col-xs-12" style={{ padding: '5px 7px', height: 40, width: '100%' }}>
          My Goal: {ucfirst(isOthers ? post.goal : post.ecardName)}
        </div>
        <div className="row">
          <div className="col-md-12 col-xs-12 to-father" style={{ padding: 20 }}>
            Message: {ucfirst(post.message)}
          </div>
        </div>
        <div className="row" style={{ position: 'absolute', width: '100%', bottom: 10 }}>
          <div className="col-md-4 col-xs-3" style={{ height: 31, padding: 20 }}>
            <img
              src={`${NY}/img/${post.liked ? 'like-on.png' : 'like-off.png'}`}
              className="vote like-image"
              alt="like"
              onClick={() => onLike(post)}
            />
            <span style={{ display: 'inline-block' }}>&nbsp;{post.likes}</span>
          </div>
          <div
            className="col-md-8 col-xs-9"
            style={{ textAlign: 'right', paddingRight: 20, paddingTop: 10, fontSize: 14 }}
          >
            From {ucwords(post.name)}
          </div>
        </div>
      </div>
      {post.mine ? (
        <a
          href="#delete"
          onClick={(e) => {
            e.preventDefault();
            onDelete(post);
          }}
        >
          <img src={`${NY}/img/remove.png`} className="delete delete-post" alt="Delete" />
        </a>
      ) : null}
    </div>
  );
}

function Pagination({ q, total, limit }) {
  const pageCount = Math.ceil(total / limit);
  const pages = Array.from({ length: pageCount }, (_, i) => i);

  return (
    <div className="col-md-12 pagination-container text-center">
      <ul className="pagination">
        {q > 0 ? (
          <li className="page-item">
            <Link className="page-link" to={`/game?q=${q - 1}`}>Previous</Link>
          </li>
        ) : (
          <li className="page-item disabled">
            <a className="page-link" href="#previous" onClick={(e) => e.preventDefault()}>Previous</a>
          </li>
        )}
        {pages.map((i) => (
          <li key={i} className={`page-item${q === i ? ' active' : ''}`}>
            <Link className="page-link" to={`/game?q=${i}`}>{i + 1}</Link>
          </li>
        ))}
        {q < pageCount - 1 ? (
          <li className="page-item">
            <Link className="page-link" to={`/game?q=${q + 1}`}>Next</Link>
          </li>
        ) : (
          <li className="page-item disabled">
            <a className="page-link" href="#next" onClick={(e) => e.preventDefault()}>Next</a>
          </li>
        )}
      </ul>
    </div>
  );
}

export default function GamePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useSelector((s) => s.auth.user);
  const demo = isDemoUser(user);
  useBlockInspect();

  const q = Math.max(0, parseInt(searchParams.get('q'), 10) || 0);

  const [feed, setFeed] = useState({ loaded: false, posts: [], total: 0, limit: 8 });
  const [form, setForm] = useState(() => initialForm(user));
  const [submitting, setSubmitting] = useState(false);
  const [popup, setPopup] = useState({ open: false, kind: 'like' });
  const emailRef = useRef(null);
  const requestRef = useRef(0);
  const likingRef = useRef(new Set());

  const load = useCallback(async () => {
    if (!user?.userId) return;
    const request = ++requestRef.current;
    try {
      const res = await apiPost('/game/posts', { userId: user.userId, page: q });
      if (request !== requestRef.current) return;
      setFeed({ loaded: true, posts: res.posts, total: res.total, limit: res.limit });
    } catch (err) {
      console.error('load posts failed', err);
      if (request === requestRef.current) setFeed((f) => ({ ...f, loaded: true }));
    }
  }, [user?.userId, q]);

  useEffect(() => {
    load();
  }, [load]);

  // game.php reloads onto the first page after a post or a delete.
  const reloadFirstPage = () => (q === 0 ? load() : navigate('/game'));

  const setField = (field, transform = (v) => v) => (e) => {
    const value = transform(stripLeadingSpaces(e.target.value));
    setForm((f) => ({ ...f, [field]: value }));
  };

  const onEcardChange = (e) => {
    const ecard = e.target.value;
    setForm((f) => ({ ...f, ecard, goal: ecard === OTHERS_ECARD ? f.goal : '' }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const formEl = e.currentTarget;

    const values = {
      name: form.name.trim(),
      ecard: form.ecard,
      goal: form.ecard === OTHERS_ECARD ? form.goal.trim() : '',
      email: form.email.trim(),
      message: form.message.trim(),
    };
    setForm((f) => ({ ...f, name: values.name, email: values.email, message: values.message, goal: values.goal }));

    if (!formEl.checkValidity()) {
      formEl.reportValidity();
      return;
    }
    if (!EMAIL_RE.test(values.email)) {
      const input = emailRef.current;
      input.setCustomValidity('Please enter a valid email address (e.g. example@gmail.com).');
      formEl.reportValidity();
      input.setCustomValidity('');
      return;
    }

    setSubmitting(true);
    try {
      const created = await apiPost('/game/post', {
        ...values,
        userId: user.userId,
        userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name,
        role: user.role || user.source || '',
      });

      if (demo) {
        await Swal.fire({ title: 'Subscribe to any PLAN to play with your peers.', icon: 'success' });
        window.location.href = plansUrl();
        return;
      }

      try {
        const reportId = await createPostReport(user);
        if (reportId) {
          await apiPost('/game/saveReportId', { userId: user.userId, postId: created.id, reportId });
        }
      } catch (err) {
        console.error('report failed', err);
      }

      setForm(initialForm(user));
      setSubmitting(false);
      reloadFirstPage();
    } catch (err) {
      console.error('post failed', err);
      setSubmitting(false);
      Swal.fire({ title: 'Something went wrong', text: err.message, icon: 'error' });
    }
  };

  const onLike = async (post) => {
    if (likingRef.current.has(post.id)) return;

    if (demo) {
      Swal.fire({ title: '', text: 'Subscribe to any plan to LIKE posts.', icon: 'error' });
      return;
    }
    if (post.liked) {
      setPopup({ open: true, kind: 'ohno' });
      return;
    }

    likingRef.current.add(post.id);
    try {
      const res = await apiPost('/game/like', { userId: user.userId, postId: post.id });
      if (res.status === 'liked') {
        setPopup({ open: true, kind: 'like' });
        if (res.likesId) {
          updatePostReportPoints(user, res.likesId, res.likes).catch((err) =>
            console.error('report update failed', err)
          );
        }
      } else {
        setPopup({ open: true, kind: 'ohno' });
      }
      load();
    } catch (err) {
      console.error('like failed', err);
      Swal.fire({ title: 'Something went wrong', text: err.message, icon: 'error' });
    } finally {
      likingRef.current.delete(post.id);
    }
  };

  const onDelete = async (post) => {
    try {
      await apiPost('/game/delete', { userId: user.userId, postId: post.id });
      reloadFirstPage();
    } catch (err) {
      console.error('delete failed', err);
      Swal.fire({ title: 'Something went wrong', text: err.message, icon: 'error' });
    }
  };

  const isOthers = form.ecard === OTHERS_ECARD;

  return (
    <div
      className="ny-game"
      style={{
        '--bg-web': `url(${NY}/images/background-web.jpg?v=1)`,
        '--bg-mob': `url(${NY}/images/background-mob.jpg?v=1)`,
      }}
    >
      <EmPopup popup={popup} onClose={() => setPopup((p) => ({ ...p, open: false }))} />

      <div className="container-fluid" style={{ margin: '10px 0px' }}>
        <div className="row">
          <div className="col-sm-7 col-md-5 col-lg-5 col-xs-11 auto">
            <img src={`${NY}/images/top1.png`} className="desk" alt="" style={{ width: '100%', marginBottom: 20 }} />
          </div>
          <div className="col-sm-7 col-md-7 col-lg-7 col-xs-11 auto">
            <img src={`${NY}/images/top2.png`} className="desk" alt="" style={{ width: '100%' }} />
            <img src={`${NY}/images/Top_Title-mob.png`} className="mob" alt="" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: 0 }}>
        <div className="row">
          <div className="col-sm-10 col-md-10 col-lg-10 col-xs-12 auto">
            <img src={`${NY}/images/Icons.gif?v=1`} className="desk" alt="" style={{ width: '100%' }} />
            <img src={`${NY}/images/ICons.png`} className="mob" alt="" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: 0 }}>
        <div className="row">
          <div className="col-xs-12 col-sm-12 col-md-12 col-lg-12">
            <form id="formdata" name="formdata" onSubmit={onSubmit}>
              <div className="row">
                <div className="form-group">
                  <div className="col-xs-12 col-sm-9 col-md-8 col-lg-8 auto">
                    <div className="col-sm-3">
                      <label htmlFor="name">Your Name:- </label>
                    </div>
                    <div className="form-group mtb col-sm-8">
                      <input
                        type="text"
                        className="text-cheer"
                        id="name"
                        placeholder="Enter Name"
                        maxLength={30}
                        name="name"
                        value={form.name}
                        onChange={setField('name')}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-xs-12 col-sm-9 col-md-8 col-lg-8 auto">
                    <div className="col-sm-3">
                      <label htmlFor="ecard">Select a Badge:- </label>
                    </div>
                    <div className="form-group mtb col-sm-8">
                      <select
                        id="ecard"
                        name="ecard"
                        className="text-cheer"
                        value={form.ecard}
                        onChange={onEcardChange}
                        required
                      >
                        {ECARDS.map((card) => (
                          <option key={card.value} value={card.value}>
                            {card.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={`col-xs-12 col-sm-9 col-md-8 col-lg-8 auto goal${isOthers ? ' show' : ''}`}>
                    <div className="col-sm-3">
                      <label htmlFor="goalid">Goal:- </label>
                    </div>
                    <div className="form-group mtb col-sm-8">
                      <input
                        className="text-cheer"
                        name="goal"
                        id="goalid"
                        maxLength={30}
                        value={form.goal}
                        onChange={setField('goal', (v) => v.replace(/[0-9]/g, ''))}
                        required={isOthers}
                      />
                    </div>
                  </div>

                  <div className="col-xs-12 col-sm-9 col-md-8 col-lg-8 auto">
                    <div className="col-sm-3">
                      <label htmlFor="email">Your Email:- </label>
                    </div>
                    <div className="form-group mtb col-sm-8">
                      <input
                        className="text-cheer"
                        name="email"
                        id="email"
                        type="email"
                        placeholder="Your Email id"
                        ref={emailRef}
                        value={form.email}
                        onChange={setField('email')}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-xs-12 col-sm-9 col-md-8 col-lg-8 auto">
                    <div className="col-sm-3">
                      <label htmlFor="message">Your message:- </label>
                    </div>
                    <div className="form-group mtb col-sm-8">
                      <textarea
                        className="text-cheer"
                        name="message"
                        id="message"
                        maxLength={200}
                        rows={6}
                        value={form.message}
                        onChange={setField('message')}
                        required
                      />
                      <label>
                        Maximum <span id="chcount"> {form.message.length} </span> / 200 characters allowed{' '}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-sm-2 auto">
                  <input
                    type="submit"
                    value="SUBMIT"
                    name="submit"
                    className="submit"
                    style={{ borderRadius: 5, width: '100%', display: submitting ? 'none' : undefined }}
                  />
                </div>
                <p style={{ textAlign: 'center', width: '100%', fontStyle: 'italic' }}>
                  Press submit only once and hold on for 5 seconds
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="container-fluid">
        <div className="row">
          <div className="col-md-2" id="mob_remove" style={{ marginTop: 18 }} />
          <div className="col-md-12 for-web nopadding">
            {feed.posts.map((post) => (
              <PostCard key={post.id} post={post} onLike={onLike} onDelete={onDelete} />
            ))}

            {feed.loaded && feed.posts.length === 0 ? (
              <div className="well text-center" style={{ marginTop: 15, marginBottom: 20 }}>
                No Post. Be the first one.
              </div>
            ) : null}

            <Pagination q={q} total={feed.total} limit={feed.limit} />
          </div>
        </div>
      </div>
    </div>
  );
}
