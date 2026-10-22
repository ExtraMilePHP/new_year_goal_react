export const ROUND_KEYS = {
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
};

export const ROUND_ROUTES = {
  1: '/rounds/1',
  2: '/rounds/2',
  3: '/rounds/3',
  4: '/rounds/4',
};

export const ASSETS = {
  logo: '/assets/images/Logo.gif',
  landingDesk: '/assets/images/loginbg.jpg',
  landingMob: '/assets/images/bg_index_mobo.jpg',
  rulesDesk: '/assets/images/rules_desk.jpg',
  rulesMob: '/assets/images/rules_mobo.jpg',
  round1Desk: '/assets/images/bg1.png',
  round1Mob: '/assets/images/bg1-mob.jpg',
  round2Desk: '/assets/images/bg2.jpg',
  round2Mob: '/assets/images/bg2-mob.jpg',
  round3Desk: '/assets/images/bg3.png',
  round3Mob: '/assets/images/bg3-mob.jpg',
  round4Desk: '/assets/images/bg4.png',
  round4Mob: '/assets/images/bg4-mob.jpg',
  thankYouDesk: '/assets/images/gd_bg_desktop.png',
  thankYouMob: '/assets/images/gd_bg_mobo.png',
  thankYouGif: '/assets/images/thankyou-gif.gif',
  wordcloud: '/assets/wordcloud.svg',
  game4: '/assets/game4.svg',
};

export const ROUND1_CORRECT = ['Scissors', 'Natural', 'Bottle', 'Glue', 'Pipe'];
export const ROUND1_WRONG = ['Plastic', 'Battery', 'Screw', 'Decorative'];

export const ROUND2_CORRECT = [1, 2, 4, 5, 10];
export const ROUND2_ORDER = [7, 1, 2, 9, 3, 4, 5, 6, 8, 10];

export const ROUND3_QUESTIONS = [
  'STTIAOANYR',
  'PLNAATEBL PNECLI',
  'PANLST',
  'BOIGEDRADBAEL CTUELYR',
  'PPARE GAB',
];

export const ROUND3_ANSWERS = [
  'stationary',
  'plantable pencil',
  'plants',
  'biodegradable cutlery',
  'paper bag',
];

export const ROUND4_ITEMS = [
  { className: 'Toys', label: 'Toys', field: 'text1' },
  { className: 'Shoes', label: 'Shoes', field: 'text2' },
  { className: 'Clothes', label: 'Clothes', field: 'text3' },
  { className: 'Books', label: 'Books', field: 'text4' },
  { className: 'Lamps', label: 'Lamps', field: 'text5' },
];

export const ROUND_COPY = {
  1: {
    title: 'Ghar Ke PATAAKHE',
    subtitle: 'Drop the market-wale Firecrackers!',
    description:
      "It's time to go back to the basics and upcycle to enjoy a home-made Pataakha launcher. Identify the ingredients needed and watch your rockets come alive:",
    align: 'left',
  },
  2: {
    title: 'Go NATURAL',
    subtitle: 'with the lights and decor',
    description:
      "It's time to go back to the basics and upcycle to enjoy a homemade Pataakha launcher. Identify the ingredients needed, and watch your rockets come alive. It's important to be mindful of the electricity we are consuming. Identify the substitutes that are eco-friendly, cost-effective, and keep your home traditionally warm",
    align: 'right',
  },
  3: {
    title: 'GREEN GIFTING',
    subtitle: '',
    description:
      'Be thoughtful in your gifting and parties this season. Identify green options from the scrambled word search below.',
    align: 'left',
    dark: true,
  },
  4: {
    title: 'Be GIVING',
    subtitle: '',
    description:
      'Do your Diwali cleaning right! Identify items in good condition that you may not necessarily need anymore and donate to a non-profit. The game below helps you identify those items:',
    align: 'left',
  },
};

export const RULES = [
  'The box will turn green if the answer is correct.',
  'The box will turn red if the answer is wrong.',
];

export function plansUrl() {
  const base = (process.env.REACT_APP_BASE_URL || 'https://extramileplay.com').replace(/\/+$/, '');
  return `${base}/plans`;
}

export function extraMileHome() {
  return process.env.REACT_APP_BASE_URL || 'https://extramileplay.com';
}
