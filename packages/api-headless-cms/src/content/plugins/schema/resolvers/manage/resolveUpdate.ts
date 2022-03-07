import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { CmsEntryResolverFactory as ResolverFactory, UpdateCmsEntryInput } from "~/types";

interface ResolveUpdateArgs {
    revision: string;
    data: UpdateCmsEntryInput;
}
type ResolveUpdate = ResolverFactory<any, ResolveUpdateArgs>;

export const resolveUpdate: ResolveUpdate =
    ({ model }) =>
    async (_, args: any, context) => {
        try {
            const entry = await context.cms.updateEntry(model, args.revision, args.data);

            return new Response(entry);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
