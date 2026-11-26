import { ErrorResponse } from "@webiny/api-graphql/responses.js";
import { Response } from "@webiny/api-graphql/responses.js";
import type { CmsEntryResolverFactory as ResolverFactory } from "~/types/index.js";
import { GetLatestSingletonEntryUseCase } from "~/features/contentEntry/GetLatestSingletonEntry/index.js";

type ResolveGetLatest = ResolverFactory;

export const resolveGetLatest: ResolveGetLatest =
    ({ model }) =>
    async (_: unknown, __: unknown, context) => {
        const getLatestEntry = context.container.resolve(GetLatestSingletonEntryUseCase);
        const result = await getLatestEntry.execute(model);
        if (result.isFail()) {
            return new ErrorResponse(result.error);
        }

        return new Response(result.value);
    };
