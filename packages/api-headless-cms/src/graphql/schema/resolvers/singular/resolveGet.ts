import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { CmsEntryResolverFactory as ResolverFactory } from "~/types";
import { fetchEntry } from "~/graphql/schema/resolvers/singular/fetchEntry";

interface ResolveGetArgs {
    revision: string;
}

type ResolveGet = ResolverFactory<any, ResolveGetArgs>;

export const resolveGet: ResolveGet =
    ({ model }) =>
    async (_: unknown, __: unknown, context) => {
        try {
            const entry = await fetchEntry({
                context,
                model
            });

            return new Response(entry);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
