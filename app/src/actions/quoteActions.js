import { SAVE_OWNER_DATA } from "./types";

export const saveOwnerData = (ownerData) => {
  return {
    type: SAVE_OWNER_DATA,
    ownerData,
  };
};

