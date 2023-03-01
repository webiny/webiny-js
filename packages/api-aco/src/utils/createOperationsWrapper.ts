import { CreateAcoStorageOperationsParams } from "~/createAcoStorageOperations";
import { CmsModel } from "@webiny/api-headless-cms/types";
import WebinyError from "@webiny/error";

interface CreateOperationsWrapperParams extends CreateAcoStorageOperationsParams {
    modelName: string;
}

export const createOperationsWrapper = (params: CreateOperationsWrapperParams) => {
    const { cms, security, modelName } = params;

    const withModelWithoutAuthorization = async <TResult>(
        cb: (model: CmsModel) => Promise<TResult>
    ): Promise<TResult> => {
        security.disableAuthorization();
        const model = await cms.getModel(modelName);

        if (!model) {
            throw new WebinyError(`Could not find "${modelName}" model.`, "MODEL_NOT_FOUND_ERROR");
        }

        const result = await cb(model);

        security.enableAuthorization();

        return result;
    };

    return {
        withModelWithoutAuthorization
    };
};
