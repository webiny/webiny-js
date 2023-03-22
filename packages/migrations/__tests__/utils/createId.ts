// @ts-ignore mdbid doesn't have TS types.
import mdbid from "mdbid";

export const createId = () => {
    return mdbid();
};
