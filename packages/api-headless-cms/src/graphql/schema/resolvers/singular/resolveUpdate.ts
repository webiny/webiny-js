import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import {
    CmsEntryResolverFactory as ResolverFactory,
    UpdateCmsEntryInput,
    UpdateCmsEntryOptionsInput
} from "~/types";
import { fetchEntry } from "~/graphql/schema/resolvers/singular/fetchEntry";

interface ResolveUpdateArgs {
    data: UpdateCmsEntryInput;
    options?: UpdateCmsEntryOptionsInput;
}

type ResolveUpdate = ResolverFactory<any, ResolveUpdateArgs>;

export const resolveUpdate: ResolveUpdate =
    ({ model }) =>
    async (_: unknown, args, context) => {
        try {
            const item = await fetchEntry({
                context,
                model
            });
            const entry = await context.cms.updateEntry(
                model,
                item.id,
                args.data,
                {},
                args.options
            );

            return new Response(entry);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
