import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { CmsContentModelEntryResolverFactoryType as ResolverFactory } from "@webiny/api-headless-cms/types";

export const resolveManageGet: ResolverFactory = ({ model }) => async (root, args, context) => {
    try {
        const entry = await context.cms.entries.manageGet(model, args);
        return new Response(entry);
    } catch (e) {
        return new ErrorResponse(e);
    }
};
