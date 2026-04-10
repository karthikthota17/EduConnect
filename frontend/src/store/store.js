import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import classReducer from './classSlice';
import classworkReducer from './classworkSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    classes: classReducer,
    classwork: classworkReducer,
  },
});
