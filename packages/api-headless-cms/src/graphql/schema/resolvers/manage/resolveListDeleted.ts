import { ListResponse, ListErrorResponse } from "@webiny/handler-graphql/responses.js";
import type {
    CmsEntryResolverFactory as ResolverFactory,
    CmsEntryListParams
} from "~/types/index.js";
import { ListDeletedEntriesUseCase } from "~/features/contentEntry/ListEntries/index.js";

type ResolveListDeleted = ResolverFactory<any, CmsEntryListParams>;

export const resolveListDeleted: ResolveListDeleted =
    ({ model }) =>
    async (_, args: any, context) => {
        try {
            const result = await context.container
                .resolve(ListDeletedEntriesUseCase)
                .execute(model, args);
            if (result.isFail()) {
                throw result.error;
            }
            return new ListResponse(result.value.entries, result.value.meta);
        } catch (e) {
            return new ListErrorResponse(e);
        }
    };
