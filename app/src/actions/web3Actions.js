import { SAVE_WEB3_DATA } from "./types";


export const saveWeb3Data = (web3Data) => {
    return {
      type: SAVE_WEB3_DATA,
      web3Data,
    };
  };