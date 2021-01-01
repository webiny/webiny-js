import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { CmsContentEntryResolverFactoryType as ResolverFactory } from "@webiny/api-headless-cms/types";

export const resolveUnpublish: ResolverFactory = ({ model }) => async (root, args, context) => {
    try {
        const entry = await context.cms.entries.unpublish(model, args.revision);
        return new Response(entry);
    } catch (e) {
        return new ErrorResponse(e);
    }
};
