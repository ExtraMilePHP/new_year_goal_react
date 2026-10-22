export const NY = '/newyear';

/** Badge options of the PHP <select id="ecard">. */
export const ECARDS = [
  { value: 'frdm1.png', label: 'FITNESS GOALS' },
  { value: 'frdm2.png', label: 'INVESTMENT GOALS' },
  { value: 'frdm3.png', label: 'FOLLOW MY PASSION ' },
  { value: 'frdm4.png', label: 'CALL IT QUITS' },
  { value: 'frdm5.png', label: 'KEEP LEARNING' },
  { value: 'frdm6.png', label: 'OTHERS' },
];

export const OTHERS_ECARD = 'frdm6.png';
export const REPORT_ROUND = 'New Year Goals';
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

export function plansUrl() {
  const base = (process.env.REACT_APP_BASE_URL || 'https://extramileplay.com').replace(/\/+$/, '');
  return `${base}/plans`;
}

export function extraMileHome() {
  return process.env.REACT_APP_BASE_URL || 'https://extramileplay.com';
}
