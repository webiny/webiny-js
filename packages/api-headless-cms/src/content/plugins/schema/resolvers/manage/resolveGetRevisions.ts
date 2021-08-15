import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import {
    CmsContentEntryResolverFactory as ResolverFactory,
    CmsContentEntry
} from "../../../../../types";

export const resolveGetRevisions: ResolverFactory =
    ({ model }) =>
    async (root, args, { cms }) => {
        try {
            const revisions: CmsContentEntry[] = await cms.entries.getEntryRevisions(
                model,
                args.id
            );

            return new Response(revisions.sort((a, b) => b.version - a.version));
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
