import { ErrorResponse } from "@webiny/api-graphql/responses.js";
import { Response } from "@webiny/api-graphql/responses.js";
import type { CmsEntryResolverFactory as ResolverFactory } from "~/types/index.js";
import { GetPublishedSingletonEntryUseCase } from "~/features/contentEntry/GetPublishedSingletonEntry/index.js";

type ResolveGetPublished = ResolverFactory;

export const resolveGetPublished: ResolveGetPublished =
    ({ model }) =>
    async (_: unknown, __: unknown, context) => {
        const getPublishedEntry = context.container.resolve(GetPublishedSingletonEntryUseCase);
        const result = await getPublishedEntry.execute(model);
        if (result.isFail()) {
            return new ErrorResponse(result.error);
        }

        return new Response(result.value);
    };
