import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import {
    CmsContentEntryResolverFactoryType as ResolverFactory,
    CmsContentEntryType
} from "@webiny/api-headless-cms/types";

export const resolveGetRevisions: ResolverFactory = () => async (root, args, { cms }) => {
    try {
        const revisions: CmsContentEntryType[] = await cms.entries.getEntryRevisions(args.id);

        return new Response(revisions.sort((a, b) => b.version - a.version));
    } catch (e) {
        return new ErrorResponse(e);
    }
};
