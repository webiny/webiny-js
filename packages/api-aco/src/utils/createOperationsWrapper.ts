import type { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import type { Container } from "@webiny/di";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";

interface CreateOperationsWrapperParams {
    container: Container;
    identityContext: IdentityContext.Interface;
    modelName: string;
}

export const createOperationsWrapper = (params: CreateOperationsWrapperParams) => {
    const { identityContext, container, modelName } = params;

    const withModel = async <TResult>(
        cb: (model: CmsModel) => Promise<TResult>
    ): Promise<TResult> => {
        const result = await identityContext.withoutAuthorization(() => {
            return container.resolve(GetModelUseCase).execute(modelName);
        });
        if (result.isFail()) {
            throw result.error;
        }

        return cb(result.value);
    };

    return { withModel };
};
