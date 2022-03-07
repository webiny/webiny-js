import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { CmsEntryResolverFactory as ResolverFactory } from "~/types";

interface ResolveRequestChangesArgs {
    revision: string;
}
type ResolveRequestChanges = ResolverFactory<any, ResolveRequestChangesArgs>;

export const resolveRequestChanges: ResolveRequestChanges =
    ({ model }) =>
    async (_, args: any, context) => {
        try {
            const entry = await context.cms.requestEntryChanges(model, args.revision);

            return new Response(entry);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
