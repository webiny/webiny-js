import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { CmsEntryResolverFactory as ResolverFactory } from "~/types";
import { parseIdentifier } from "@webiny/utils";

interface ResolveDeleteArgs {
    revision: string;
}
type ResolveDelete = ResolverFactory<any, ResolveDeleteArgs>;

export const resolveDelete: ResolveDelete =
    ({ model }) =>
    async (_, args: any, context) => {
        try {
            const { version } = parseIdentifier(args.revision);
            if (version) {
                await context.cms.deleteEntryRevision(model, args.revision);
            } else {
                await context.cms.deleteEntry(model, args.revision);
            }

            return new Response(true);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
