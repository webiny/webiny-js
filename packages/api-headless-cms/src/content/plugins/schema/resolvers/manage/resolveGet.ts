import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { CmsContentEntryResolverFactory as ResolverFactory } from "../../../../../types";

export const resolveGet: ResolverFactory = ({ model }) => async (root, args, context) => {
    try {
        const entry = await context.cms.entries.getById(model, args.revision);
        return new Response(entry);
    } catch (e) {
        return new ErrorResponse(e);
    }
};
