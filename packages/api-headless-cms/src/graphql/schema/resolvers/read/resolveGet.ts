import { ErrorResponse, Response } from "@webiny/handler-graphql/responses.js";
import type {
    CmsEntryListParams,
    CmsEntryResolverFactory as ResolverFactory
} from "~/types/index.js";
import { EntryNotFoundError } from "~/domain/contentEntry/errors.js";
import { ListPublishedEntriesUseCase } from "~/features/contentEntry/ListEntries/index.js";

type ResolveGet = ResolverFactory<any, CmsEntryListParams>;

export const resolveGet: ResolveGet =
    ({ model }) =>
    async (_: any, args: any, context) => {
        try {
            const result = await context.container
                .resolve(ListPublishedEntriesUseCase)
                .execute(model, { ...args, limit: 1 });
            if (result.isFail()) {
                throw result.error;
            }
            const entry = result.value.entries[0];
            if (!entry) {
                return new ErrorResponse(new EntryNotFoundError());
            }
            return new Response(entry);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
