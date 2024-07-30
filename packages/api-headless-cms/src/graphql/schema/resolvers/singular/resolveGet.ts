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
            const [items] = await context.cms.listLatestEntries(model);
            if (items.length > 1) {
                throw new Error(
                    `More than one entry found for model "${model.modelId}". Please check your data.`
                );
            }
            const item = items[0];

            return new Response(item || null);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
