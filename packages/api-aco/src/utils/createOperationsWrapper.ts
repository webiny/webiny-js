import type { HeadlessCms } from "@webiny/api-headless-cms/types/index.js";
import type { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";

interface CreateOperationsWrapperParams {
    cms: HeadlessCms;
    identityContext: IdentityContext.Interface;
    modelName: string;
}

export const createOperationsWrapper = (params: CreateOperationsWrapperParams) => {
    const { identityContext, cms, modelName } = params;

    const withModel = async <TResult>(
        cb: (model: CmsModel) => Promise<TResult>
    ): Promise<TResult> => {
        const model = await identityContext.withoutAuthorization(() => {
            return cms.getModel(modelName);
        });

        if (!model) {
            throw new WebinyError(`Could not find "${modelName}" model.`, "MODEL_NOT_FOUND_ERROR");
        }

        return cb(model);
    };

    return { withModel };
};
