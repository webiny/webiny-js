import type { Result } from "@webiny/feature/api";
import type { CmsContext, CmsEntry, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/index.js";
import { model } from "./AuthorModel.js";

/** Returns the value of an ok result; throws the error otherwise, so a setup fails at its cause. */
export const expectOk = <TValue, TError>(result: Result<TValue, TError>): TValue => {
    if (result.isFail()) {
        throw result.error;
    }
    return result.value;
};

export interface CodedError {
    code?: string;
}

/** The `code` of the error of a failed result, `null` for an ok result or an error without one. */
export const getErrorCode = <TValue>(result: Result<TValue, unknown>): string | null => {
    if (result.isOk()) {
        return null;
    }
    return (result.error as CodedError).code ?? null;
};

export const getAuthorModel = async (context: CmsContext): Promise<CmsModel> => {
    return expectOk(await context.container.resolve(GetModelUseCase).execute(model.modelId));
};

export interface AuthorEntryParams {
    name: string;
    bio: string;
}

/** Creates an "author" entry in the root folder as the context's identity. */
export const createAuthorEntry = async (
    context: CmsContext,
    params: AuthorEntryParams
): Promise<CmsEntry> => {
    const authorModel = await getAuthorModel(context);
    return expectOk(
        await context.container.resolve(CreateEntryUseCase).execute(authorModel, {
            values: { name: params.name, bio: params.bio },
            location: { folderId: "root" }
        })
    );
};

/** The stored revision, read without access checks. */
export const readEntry = async (context: CmsContext, revisionId: string): Promise<CmsEntry> => {
    const authorModel = await getAuthorModel(context);
    return expectOk(
        await context.container.resolve(GetRevisionByIdUseCase).execute(authorModel, revisionId)
    );
};
