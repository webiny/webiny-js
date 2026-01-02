import { ErrorResponse, Response } from "@webiny/handler-graphql/responses.js";
import type { CmsEntryResolverFactory as ResolverFactory } from "~/types/index.js";
import { GetSingletonEntryUseCase } from "~/features/contentEntry/GetSingletonEntry/index.js";

interface ResolveGetArgs {
    revision: string;
}

type ResolveGet = ResolverFactory<any, ResolveGetArgs>;

export const resolveGet: ResolveGet =
    ({ model }) =>
    async (_: unknown, __: unknown, context) => {
        const getEntry = context.container.resolve(GetSingletonEntryUseCase);
        const entry = await getEntry.execute(model);
        if (entry.isFail()) {
            return new ErrorResponse(entry.error);
        }

        return new Response(entry.value);
    };
