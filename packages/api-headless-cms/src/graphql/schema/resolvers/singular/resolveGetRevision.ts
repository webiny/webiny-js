import { ErrorResponse } from "@webiny/api-graphql/responses.js";
import { Response } from "@webiny/api-graphql/responses.js";
import type { CmsEntryResolverFactory as ResolverFactory } from "~/types/index.js";
import { GetSingletonEntryRevisionUseCase } from "~/features/contentEntry/GetSingletonEntryRevision/index.js";

interface ResolveGetRevisionArgs {
    revision: string;
}

type ResolveGetRevision = ResolverFactory<any, ResolveGetRevisionArgs>;

export const resolveGetRevision: ResolveGetRevision =
    ({ model }) =>
    async (_: unknown, args, context) => {
        const getRevision = context.container.resolve(GetSingletonEntryRevisionUseCase);
        const result = await getRevision.execute(model, args.revision);
        if (result.isFail()) {
            return new ErrorResponse(result.error);
        }

        return new Response(result.value);
    };
