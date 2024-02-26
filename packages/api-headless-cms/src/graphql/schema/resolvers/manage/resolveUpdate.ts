import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import {
    CmsEntryResolverFactory as ResolverFactory,
    UpdateCmsEntryInput,
    UpdateCmsEntryOptionsInput
} from "~/types";

interface ResolveUpdateArgs {
    revision: string;
    data: UpdateCmsEntryInput;
    options?: UpdateCmsEntryOptionsInput;
}
type ResolveUpdate = ResolverFactory<any, ResolveUpdateArgs>;

export const resolveUpdate: ResolveUpdate =
    ({ model }) =>
    async (_, args, context) => {
        try {
            const entry = await context.cms.updateEntry(
                model,
                args.revision,
                args.data,
                {},
                args.options
            );

            return new Response(entry);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
