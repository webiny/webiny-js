import type { HeadlessCms } from "@webiny/api-headless-cms/types/index.js";
import type { Security } from "@webiny/api-core/types/security.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";

interface CreateOperationsWrapperParams {
    cms: HeadlessCms;
    security: Security;
    modelName: string;
}

export const createOperationsWrapper = (params: CreateOperationsWrapperParams) => {
    const { security, cms, modelName } = params;

    const withModel = async <TResult>(
        cb: (model: CmsModel) => Promise<TResult>
    ): Promise<TResult> => {
        const model = await security.withoutAuthorization(() => {
            return cms.getModel(modelName);
        });

        if (!model) {
            throw new WebinyError(`Could not find "${modelName}" model.`, "MODEL_NOT_FOUND_ERROR");
        }

        return cb(model);
    };

    return { withModel };
};
