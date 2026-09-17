import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { NotAuthorizedError } from "@webiny/api-headless-cms/utils/errors.js";
import type { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";

export interface IAssertModelDeletableParams {
    readonly accessControl: AccessControl.Interface;
    readonly model: CmsModel;
}

/**
 * The access checks every delete-model operation makes: delete on the model, write on its entries.
 * All three operations ran this same pair inline.
 */
export const assertModelDeletable = async (params: IAssertModelDeletableParams): Promise<void> => {
    const { accessControl, model } = params;

    const canAccessModel = await accessControl.canAccessModel({ model, rwd: "d" });
    if (!canAccessModel) {
        throw new NotAuthorizedError(`Not allowed to access content model "${model.name}".`);
    }

    const canAccessEntry = await accessControl.canAccessEntry({ model, rwd: "w" });
    if (!canAccessEntry) {
        throw new NotAuthorizedError(`Not allowed to access "${model.modelId}" entries.`);
    }
};
