import { ErrorResponse, ListResponse } from "@webiny/handler-graphql/responses.js";
import type { CmsEntryResolverFactory as ResolverFactory } from "~/types/index.js";
import { DeleteMultipleEntriesUseCase } from "~/features/contentEntry/DeleteMultipleEntries/index.js";

interface ResolveDeleteArgs {
    revision: string;
}

type ResolveDelete = ResolverFactory<any, ResolveDeleteArgs>;

export const resolveDeleteMultiple: ResolveDelete =
    ({ model }) =>
    async (_, args: any, context) => {
        try {
            const result = await context.container
                .resolve(DeleteMultipleEntriesUseCase)
                .execute(model, { entries: args?.entries || [] });
            if (result.isFail()) {
                throw result.error;
            }
            return new ListResponse(result.value);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
