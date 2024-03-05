import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { CmsEntryResolverFactory as ResolverFactory } from "~/types";

interface ResolveGetRevisionsArgs {
    id: string;
    deleted?: boolean;
}
type ResolveGetRevisions = ResolverFactory<any, ResolveGetRevisionsArgs>;

export const resolveGetRevisions: ResolveGetRevisions =
    ({ model }) =>
    async (_, args: any, context) => {
        const { id, deleted = false } = args;
        try {
            const revisions = await context.cms.getEntryRevisions(model, id);

            return new Response(revisions.sort((a, b) => b.version - a.version));
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
