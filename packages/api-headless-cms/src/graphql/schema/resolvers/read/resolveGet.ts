import { ErrorResponse, Response } from "@webiny/handler-graphql/responses.js";
import type {
    CmsEntryListParams,
    CmsEntryResolverFactory as ResolverFactory
} from "~/types/index.js";
import { EntryNotFoundError } from "~/domains/contentEntries/errors.js";

type ResolveGet = ResolverFactory<any, CmsEntryListParams>;

export const resolveGet: ResolveGet =
    ({ model }) =>
    async (_: any, args: any, context) => {
        try {
            const [[entry]] = await context.cms.listPublishedEntries(model, {
                ...args,
                limit: 1
            });
            if (!entry) {
                return new ErrorResponse(new EntryNotFoundError());
            }
            return new Response(entry);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
