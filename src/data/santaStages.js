export const SANTA = '/santa';

/** Public-folder URLs. Kept out of CSS so webpack does not try to import them. */
export const SANTA_PAGE_BG = {
  '--santa-bg-desk': `url(${SANTA}/BG.gif)`,
  '--santa-bg-mob': `url(${SANTA}/Mobile-Intro_bg2.gif)`,
};

export const STAGE_HINTS = {
  1: 'Unwrap the magic!\nThe key to guiding Santa lies within the pixels. Seek the visual clues in the image of Santa\'s route to reveal the path forward',
  2: 'Reading the sentence out loud might just spill the quirky beans.',
  3: 'Crack the code in the circular alphabet image to reveal the numeric values assigned to each letter. Use these values to calculate the total number of ELVES',
  4: 'Crack the festive code!\nThe playful elves have turned gift names into quirky rebus puzzles. Look for visual clues and imaginative connections within the symbols. Each rebus tells a tale, unveiling the names for precise gift distribution.',
};

export const STAGE_NEXT = {
  1: '/rounds/2',
  2: '/rounds/3',
  3: '/rounds/4',
  4: '/thank-you',
};

const STAGE2 = [
  ['ans1', '1. Cen tayed cane dull', 'scented candle'],
  ['ans2', '2. See weet Cho oak lay ate', 'sweet chocolate'],
  ['ans3', '3. Bue loo Elle phe ant', 'blue elephant'],
  ['ans4', '4. Noo eww Shhh oos', 'new shoes'],
  ['ans5', '5. Sko cool Baag', 'school bag'],
  ['ans6', '6. Skie ping Row ope', 'skipping rope'],
];

const STAGE4 = [
  ['ans1', 'img1.png', ['green house', 'greenhouse']],
  ['ans2', 'img2.png', ['lego']],
  ['ans3', 'img3.jpg', ['lemonade']],
  ['ans4', 'img4.jpg', ['pumpkin pie']],
  ['ans5', 'img5.png', ['candy']],
];

function textField(id, answers, { trimOnChange = true } = {}) {
  const list = answers.map((answer) => answer.toLowerCase());
  const matches = (value) => list.includes(String(value).trim().toLowerCase());
  return {
    id,
    keyCheck: matches,
    changeCheck: trimOnChange ? matches : (value) => list.includes(String(value).toLowerCase()),
    clearBlankOnChange: trimOnChange,
  };
}

export function fieldsForStage(stage) {
  if (stage === 1) {
    return [{
      id: 'ans1',
      keyCheck: (value) => value.trim().toUpperCase() === 'SWEATER',
      changeCheck: (value) => String(value).toUpperCase() === 'SWEATER',
      clearBlankOnChange: false,
    }];
  }
  if (stage === 2) {
    return STAGE2.map(([id, label, answer]) => ({ ...textField(id, [answer]), label }));
  }
  if (stage === 3) {
    return [{
      id: 'ans1',
      keyCheck: (value) => Number(value.trim()) === 57,
      changeCheck: (value) => Number(value) === 57,
      clearBlankOnChange: false,
    }];
  }
  return STAGE4.map(([id, image, answers]) => ({ ...textField(id, answers), image }));
}
