import { ErrorResponse } from "@webiny/api-graphql/responses.js";
import { Response } from "@webiny/api-graphql/responses.js";
import type { CmsEntryResolverFactory as ResolverFactory } from "~/types/index.js";
import { ListSingletonEntryRevisionsUseCase } from "~/features/contentEntry/ListSingletonEntryRevisions/index.js";

interface ResolveGetRevisionsArgs {
    id: string;
}

type ResolveGetRevisions = ResolverFactory<any, ResolveGetRevisionsArgs>;

export const resolveGetRevisions: ResolveGetRevisions =
    ({ model }) =>
    async (_: unknown, args, context) => {
        const listRevisions = context.container.resolve(ListSingletonEntryRevisionsUseCase);
        const result = await listRevisions.execute(model, args.id);
        if (result.isFail()) {
            return new ErrorResponse(result.error);
        }

        const revisions = result.value.sort((a, b) => b.version - a.version);

        return new Response(revisions);
    };
