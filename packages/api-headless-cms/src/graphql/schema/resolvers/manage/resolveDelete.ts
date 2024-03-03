import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { CmsDeleteEntryOptions, CmsEntryResolverFactory as ResolverFactory } from "~/types";
import { parseIdentifier } from "@webiny/utils";

interface ResolveDeleteArgs {
    revision: string;
    options?: CmsDeleteEntryOptions;
}
type ResolveDelete = ResolverFactory<any, ResolveDeleteArgs>;

export const resolveDelete: ResolveDelete =
    ({ model }) =>
    async (_, args, context) => {
        try {
            const { revision, options: deleteOptions } = args || {};
            const { version } = parseIdentifier(revision);
            if (version) {
                await context.cms.deleteEntryRevision(model, revision);
            } else {
                /**
                 * @see CmsDeleteEntryOptions
                 */
                const options: CmsDeleteEntryOptions = {
                    force: deleteOptions?.force === true,
                    permanent: deleteOptions?.permanent ?? true
                };
                await context.cms.deleteEntry(model, revision, options);
            }

            return new Response(true);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
