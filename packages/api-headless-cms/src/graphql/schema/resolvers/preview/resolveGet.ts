import { ErrorResponse, Response } from "@webiny/handler-graphql/responses.js";
import { NotFoundError } from "@webiny/handler-graphql";
import type {
    CmsEntryListParams,
    CmsEntryResolverFactory as ResolverFactory
} from "~/types/index.js";
import { ListLatestEntriesUseCase } from "~/features/contentEntry/ListEntries/index.js";

type ResolveGet = ResolverFactory<any, CmsEntryListParams>;

export const resolveGet: ResolveGet =
    ({ model }) =>
    async (_: any, args: any, context) => {
        try {
            const result = await context.container
                .resolve(ListLatestEntriesUseCase)
                .execute(model, { ...args, limit: 1 });
            if (result.isFail()) {
                throw result.error;
            }
            const entry = result.value.entries[0];
            if (!entry) {
                throw new NotFoundError(`Entry not found!`);
            }
            return new Response(entry);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
