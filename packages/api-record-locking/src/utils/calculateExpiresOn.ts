import { IHeadlessCmsLockRecordParams } from "./convertEntryToLockRecord";
import { getTimeout } from "./getTimeout";

export const calculateExpiresOn = (input: Pick<IHeadlessCmsLockRecordParams, "savedOn">): Date => {
    const timeout = getTimeout();

    const savedOn = new Date(input.savedOn);

    return new Date(savedOn.getTime() + timeout);
};
