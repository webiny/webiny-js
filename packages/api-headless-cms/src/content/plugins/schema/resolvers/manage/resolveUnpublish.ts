import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { CmsContentEntryResolverFactory as ResolverFactory } from "~/types";

export const resolveUnpublish: ResolverFactory =
    ({ model }) =>
    async (_, args, context) => {
        try {
            const entry = await context.cms.entries.unpublishEntry(model, args.revision);
            return new Response(entry);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
