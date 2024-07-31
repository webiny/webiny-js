import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { CmsEntryResolverFactory as ResolverFactory } from "~/types";

interface ResolveGetArgs {
    revision: string;
}

type ResolveGet = ResolverFactory<any, ResolveGetArgs>;

export const resolveGet: ResolveGet =
    ({ model }) =>
    async (_: unknown, __: unknown, context) => {
        try {
            const manager = await context.cms.getSingletonEntryManager(model);
            const entry = await manager.get();

            return new Response(entry);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
