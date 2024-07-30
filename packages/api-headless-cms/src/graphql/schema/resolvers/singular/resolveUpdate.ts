import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import {
    CmsEntryResolverFactory as ResolverFactory,
    UpdateCmsEntryInput,
    UpdateCmsEntryOptionsInput
} from "~/types";
import { NotFoundError } from "@webiny/handler-graphql";

interface ResolveUpdateArgs {
    data: UpdateCmsEntryInput;
    options?: UpdateCmsEntryOptionsInput;
}

type ResolveUpdate = ResolverFactory<any, ResolveUpdateArgs>;

export const resolveUpdate: ResolveUpdate =
    ({ model }) =>
    async (_: unknown, args, context) => {
        try {
            const [items] = await context.cms.listLatestEntries(model);
            if (items.length > 1) {
                throw new Error(
                    `More than one entry found for model "${model.modelId}". Please check your data.`
                );
            } else if (items.length === 0) {
                throw new NotFoundError(
                    `Entry in the model "${model.modelId}" not found. Please update the data.`
                );
            }
            const item = items[0];

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
