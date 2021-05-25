import { SAVE_WEB3_DATA } from "../actions/types";

export const initialState = {
  web3: {},
  policyContract: {},
  policyOwnerWallet: "",
};

export const web3Reducer = (state = initialState, action) => {
  switch (action.type) {
    case SAVE_WEB3_DATA:
      
      return {
        ...state,
        web3: action.web3Data.web3,
        policyContract: action.web3Data.policyContract,
        policyOwnerWallet: action.web3Data.policyOwnerWallet
      };
    default:
      return state;
  }
};
