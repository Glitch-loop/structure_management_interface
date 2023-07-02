import { configureStore } from "@reduxjs/toolkit";
import { userSlice } from "./slices/userSlice";
import { appSlice } from "./slices/appSlice"

export const store = configureStore({
  reducer: {
    userReducer: userSlice.reducer,
    appReducer: appSlice.reducer
  }
})

export type RootState = ReturnType<typeof store.getState>