import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { CmsContentEntryResolverFactoryType as ResolverFactory } from "@webiny/api-headless-cms/types";

export const resolveManageGet: ResolverFactory = ({ model }) => async (root, args, context) => {
    try {
        const [entry] = await context.cms.entries.getByIds(model, [args.revision]);
        return new Response(entry);
    } catch (e) {
        return new ErrorResponse(e);
    }
};
