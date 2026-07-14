import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from './apiSlice.js';
import authReducer from './slices/authSlice.js';
import { rtkQueryErrorLogger } from './middlewares/errorLogger.js'; 

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(apiSlice.middleware)
      .concat(rtkQueryErrorLogger), 
});