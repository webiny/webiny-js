import type { Result } from "@webiny/feature/api";
import type { CmsContext, CmsEntry, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { model } from "~tests/__cms/models.js";

/** The review namespace of the test model. */
export const AUTHOR_NAMESPACE = `cms.${model.modelId}`;

/** Returns the value of an ok result; throws the error otherwise, so setup fails at its cause. */
export const expectOk = <TValue, TError>(result: Result<TValue, TError>): TValue => {
    if (result.isFail()) {
        throw result.error;
    }
    return result.value;
};

export const getAuthorModel = async (context: CmsContext): Promise<CmsModel> => {
    return expectOk(await context.container.resolve(GetModelUseCase).execute(model.modelId));
};

export interface AuthorEntryParams {
    name: string;
    /** Defaults to the root folder. */
    folderId?: string;
}

/** Creates an "author" entry as the context's identity. */
export const createAuthorEntry = async (
    context: CmsContext,
    params: AuthorEntryParams
): Promise<CmsEntry> => {
    const authorModel = await getAuthorModel(context);
    return expectOk(
        await context.container.resolve(CreateEntryUseCase).execute(authorModel, {
            values: { name: params.name },
            location: { folderId: params.folderId ?? "root" }
        })
    );
};

/** Creates an entry of any code model that has the "author" fields, as the context's identity. */
export const createModelEntry = async (
    context: CmsContext,
    modelId: string,
    params: AuthorEntryParams
): Promise<CmsEntry> => {
    const targetModel = expectOk(await context.container.resolve(GetModelUseCase).execute(modelId));
    return expectOk(
        await context.container.resolve(CreateEntryUseCase).execute(targetModel, {
            values: { name: params.name },
            location: { folderId: params.folderId ?? "root" }
        })
    );
};
