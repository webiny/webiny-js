import { ErrorResponse, Response } from "@webiny/handler-graphql/responses.js";
import type { CmsEntryResolverFactory as ResolverFactory } from "~/types/index.js";
import { GetRevisionsByEntryIdUseCase } from "~/features/contentEntry/GetRevisionsByEntryId/index.js";

interface ResolveGetRevisionsArgs {
    id: string;
}
type ResolveGetRevisions = ResolverFactory<any, ResolveGetRevisionsArgs>;

export const resolveGetRevisions: ResolveGetRevisions =
    ({ model }) =>
    async (_, args: any, context) => {
        try {
            const result = await context.container
                .resolve(GetRevisionsByEntryIdUseCase)
                .execute(model, args.id);
            if (result.isFail()) {
                throw result.error;
            }
            return new Response(result.value.sort((a, b) => b.version - a.version));
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
