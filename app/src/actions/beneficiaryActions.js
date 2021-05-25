import { SAVE_BENEFICIARY_DATA } from "./types";


export const saveBeneficiaryData = (beneficiaryData) => {
    return {
      type: SAVE_BENEFICIARY_DATA,
      beneficiaryData,
    };
  };