import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { CmsContentModelEntryResolverFactoryType as ResolverFactory } from "@webiny/api-headless-cms/types";

type ResolveCreate = ResolverFactory<any, { data: Record<string, any> }>;

export const resolveCreate: ResolveCreate = ({ model }) => async (root, args, { cms }) => {
    try {
        const entry = await cms.entries.create(model, args.data);

        return new Response(entry);
    } catch (e) {
        return new ErrorResponse(e);
    }
};
