import { configureStore } from '@reduxjs/toolkit';
import sessionReducer from './sessionSlice';
import authReducer from './authSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    session: sessionReducer,
    auth: authReducer,
    ui: uiReducer,
  },
});
