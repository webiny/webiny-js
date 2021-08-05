import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { CmsContentEntryResolverFactory as ResolverFactory } from "../../../../../types";

type ResolveCreateFrom = ResolverFactory<any, { revision: string; data: Record<string, any> }>;

export const resolveCreateFrom: ResolveCreateFrom =
    ({ model }) =>
    async (root, args, { cms }) => {
        try {
            const newRevision = await cms.entries.createRevisionFrom(
                model,
                args.revision,
                args.data || {}
            );
            return new Response(newRevision);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
