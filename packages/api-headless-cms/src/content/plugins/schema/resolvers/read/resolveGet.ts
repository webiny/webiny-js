import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { CmsContentEntryResolverFactory as ResolverFactory } from "~/types";
import { NotFoundError } from "@webiny/handler-graphql";

export const resolveGet: ResolverFactory =
    ({ model }) =>
    async (_, args, context) => {
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
