import type { IRecordLockingIdentity } from "~/types.js";
import { LockUpdateError } from "~/utils/errors.js";

export interface IValidateSameIdentityParams {
    getIdentity: () => Pick<IRecordLockingIdentity, "id">;
    target: Pick<IRecordLockingIdentity, "id">;
}

export const validateSameIdentity = (params: IValidateSameIdentityParams): void => {
    const { getIdentity, target } = params;
    const identity = getIdentity();
    if (identity.id === target.id) {
        return;
    }

    throw new LockUpdateError("Cannot update lock record. Record is locked by another user.");
};
