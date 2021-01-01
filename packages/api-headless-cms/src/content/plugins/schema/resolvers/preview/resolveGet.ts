import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { CmsContentEntryResolverFactoryType as ResolverFactory } from "@webiny/api-headless-cms/types";
import { NotFoundError } from "@webiny/handler-graphql";

export const resolveGet: ResolverFactory = ({ model }) => async (root, args, context) => {
    try {
        const [[entry]] = await context.cms.entries.listLatest(model, { ...args, limit: 1 });
        if (!entry) {
            throw new NotFoundError(`Entry not found!`);
        }
        return new Response(entry);
    } catch (e) {
        return new ErrorResponse(e);
    }
};
