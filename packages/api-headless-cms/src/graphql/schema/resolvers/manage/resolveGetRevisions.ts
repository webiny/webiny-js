import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { CmsEntryResolverFactory as ResolverFactory } from "~/types";

interface ResolveGetRevisionsArgs {
    id: string;
}
type ResolveGetRevisions = ResolverFactory<any, ResolveGetRevisionsArgs>;

export const resolveGetRevisions: ResolveGetRevisions =
    ({ model }) =>
    async (_, args: any, context) => {
        try {
            const revisions = await context.cms.getEntryRevisions(model, args.id);

            return new Response(revisions.sort((a, b) => b.version - a.version));
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
