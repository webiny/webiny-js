import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { CmsEntryResolverFactory as ResolverFactory } from "~/types";

interface ResolveUnpublishArgs {
    revision: string;
}
type ResolveUnpublish = ResolverFactory<any, ResolveUnpublishArgs>;

export const resolveUnpublish: ResolveUnpublish =
    ({ model }) =>
    async (_, args: any, context) => {
        try {
            const entry = await context.cms.unpublishEntry(model, args.revision);
            return new Response(entry);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
