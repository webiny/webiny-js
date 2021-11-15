import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { CmsEntryResolverFactory as ResolverFactory, CmsEntry } from "~/types";

export const resolveGetRevisions: ResolverFactory =
    ({ model }) =>
    async (_, args, { cms }) => {
        try {
            const revisions: CmsEntry[] = await cms.getEntryRevisions(model, args.id);

            return new Response(revisions.sort((a, b) => b.version - a.version));
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
