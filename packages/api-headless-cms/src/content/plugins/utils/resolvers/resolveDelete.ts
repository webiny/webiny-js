import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { CmsContentModelEntryResolverFactoryType as ResolverFactory } from "@webiny/api-headless-cms/types";

export const resolveDelete: ResolverFactory = ({ model }) => async (root, args, context) => {
    try {
        await context.cms.entries.delete(model, args.revision);
        return new Response(true);
    } catch (e) {
        return new ErrorResponse(e);
    }
};
