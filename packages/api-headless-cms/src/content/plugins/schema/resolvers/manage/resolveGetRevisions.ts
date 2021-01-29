import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import {
    CmsContentEntryResolverFactory as ResolverFactory,
    CmsContentEntry
} from "@webiny/api-headless-cms/types";

export const resolveGetRevisions: ResolverFactory = () => async (root, args, { cms }) => {
    try {
        const revisions: CmsContentEntry[] = await cms.entries.getEntryRevisions(args.id);

        return new Response(revisions.sort((a, b) => b.version - a.version));
    } catch (e) {
        return new ErrorResponse(e);
    }
};
