import { ListResponse, ListErrorResponse } from "@webiny/handler-graphql/responses.js";
import type {
    CmsEntryResolverFactory as ResolverFactory,
    CmsEntryListParams
} from "~/types/index.js";
import { ListLatestEntriesUseCase } from "~/features/contentEntry/ListEntries/index.js";

type ResolveList = ResolverFactory<any, CmsEntryListParams>;

export const resolveList: ResolveList =
    ({ model }) =>
    async (_: any, args: any, context) => {
        try {
            const result = await context.container
                .resolve(ListLatestEntriesUseCase)
                .execute(model, args);
            if (result.isFail()) {
                throw result.error;
            }
            return new ListResponse(result.value.entries, result.value.meta);
        } catch (e) {
            return new ListErrorResponse(e);
        }
    };
