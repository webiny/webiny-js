import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { CmsEntryListParams, CmsEntryResolverFactory as ResolverFactory } from "~/types";
import { NotFoundError } from "@webiny/handler-graphql";

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
                throw new NotFoundError(`Entry not found!`);
            }
            return new Response(entry);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
