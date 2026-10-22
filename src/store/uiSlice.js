import { createSlice } from '@reduxjs/toolkit';

const persistedUser = JSON.parse(localStorage.getItem('userData') || 'null');
const defaultLogoUrl = process.env.REACT_APP_EM_LOGO || null;

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    companyLogoUrl: persistedUser?.companyLogoUrl || defaultLogoUrl,
    backButtonUrl: null,
    coinsLeft: null,
  },
  reducers: {
    setCompanyLogoUrl(state, action) {
      state.companyLogoUrl = action.payload;
    },
    setBackButtonUrl(state, action) {
      state.backButtonUrl = action.payload;
    },
    setCoinsLeft(state, action) {
      state.coinsLeft = action.payload;
    },
  },
});

export const { setCompanyLogoUrl, setBackButtonUrl, setCoinsLeft } = uiSlice.actions;
export default uiSlice.reducer;
