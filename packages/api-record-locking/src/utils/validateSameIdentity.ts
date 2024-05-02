import { NotAuthorizedError } from "@webiny/api-security";
import { IRecordLockingIdentity } from "~/types";

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
    throw new NotAuthorizedError({
        message: "Cannot update lock record. Record is locked by another user.",
        code: "LOCK_UPDATE_ERROR"
    });
};
