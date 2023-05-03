import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
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
            const { revision, force } = args || {};
            const { version } = parseIdentifier(revision);
            if (version) {
                await context.cms.deleteEntryRevision(model, revision);
            } else {
                await context.cms.deleteEntry(model, revision, force === true);
            }

            return new Response(true);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
