import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { CmsEntryResolverFactory as ResolverFactory } from "~/types";

interface ResolveRepublishArgs {
    revision: string;
}
type ResolveRepublish = ResolverFactory<any, ResolveRepublishArgs>;

export const resolveRepublish: ResolveRepublish =
    ({ model }) =>
    async (_, args: any, context) => {
        try {
            const entry = await context.cms.republishEntry(model, args.revision);
            return new Response(entry);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
