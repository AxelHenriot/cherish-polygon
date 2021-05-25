import { SAVE_BENEFICIARY_DATA } from "../actions/types";

export const initialState = {
  beneficiaryParameters: []
};

export const beneficiariesReducer = (state = initialState, action) => {
  switch (action.type) {
    case SAVE_BENEFICIARY_DATA:

    let newBeneficiaryParameters;
    let existingBeneficiary = state.beneficiaryParameters.find(beneficiary => beneficiary.beneficiaryNumber === action.beneficiaryData.beneficiaryNumber);
    if(existingBeneficiary) {
        newBeneficiaryParameters = state.beneficiaryParameters;
        newBeneficiaryParameters[state.beneficiaryParameters.findIndex(beneficiary => beneficiary.beneficiaryNumber === action.beneficiaryData.beneficiaryNumber)] = action.beneficiaryData;
    } else {
        newBeneficiaryParameters = state.beneficiaryParameters.concat(action.beneficiaryData);
    }

      return {
        ...state,
        beneficiaryParameters: newBeneficiaryParameters,
      };
    default:
      return state;
  }
};
