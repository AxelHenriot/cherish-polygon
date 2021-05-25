import { SAVE_OWNER_DATA } from "../actions/types";

export const initialState = {
  ownerData: {
    firstName: "",
    lastName: "",
    email: "",
    age: 0,
    sex: "",
    ownerUUID: ""
  }};

export const quoteReducer = (state = initialState, action) => {
  switch (action.type) {
    case SAVE_OWNER_DATA:

      return {
        ...state,
        ownerData: action.ownerData,
      };

    default:
      return state;
  }
};
