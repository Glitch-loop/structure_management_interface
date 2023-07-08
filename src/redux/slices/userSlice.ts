import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { IUser } from "../../interfaces/interfaces"

const initialState:IUser = {};

export const userSlice = createSlice({
  name: 'userSlice',
  initialState,
  reducers: {
    setInitialState: (state, action: PayloadAction<IUser>) => {
      return {...action.payload}
    },
    userLogout: (state, action: PayloadAction) => {
      localStorage.removeItem('hjN8wY5KBs3NWhGv');
      return {};
    },
    setCurrentUser: (state, action: PayloadAction<IUser>) => {
      const { ...protoPayload } = action.payload;
      console.log("Token: ", action.payload.sessionToken)
      localStorage.setItem('hjN8wY5KBs3NWhGv', action.payload.sessionToken || '');
      return { ...state, ...protoPayload }
    },
    updateCurrentUser: (state, action: PayloadAction<IUser>) => {
      return { ...state, ...action.payload }
    },
    updateSessionToken: (state, action: PayloadAction<string>) => {
      localStorage.setItem('hjN8wY5KBs3NWhGv', action.payload);
    }
  }
});

export const {
  setInitialState,
  userLogout,
  setCurrentUser,
  updateCurrentUser,
  updateSessionToken,
} = userSlice.actions;