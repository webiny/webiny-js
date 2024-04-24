import { CmsIdentity } from "~/types";
import { NotAuthorizedError } from "@webiny/api-security";

export interface IValidateSameIdentityParams {
    getIdentity: () => Pick<CmsIdentity, "id">;
    target: Pick<CmsIdentity, "id">;
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
