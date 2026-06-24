import { ErrorResponse, Response } from "@webiny/handler-graphql/responses.js";
import type {
    CmsDeleteEntryOptions,
    CmsEntryResolverFactory as ResolverFactory
} from "~/types/index.js";
import { parseIdentifier } from "@webiny/utils";
import { DeleteEntryRevisionUseCase } from "~/features/contentEntry/DeleteEntryRevision/index.js";
import { DeleteEntryUseCase } from "~/features/contentEntry/DeleteEntry/index.js";

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
                const result = await context.container
                    .resolve(DeleteEntryRevisionUseCase)
                    .execute(model, revision);
                if (result.isFail()) {
                    throw result.error;
                }
            } else {
                const options: CmsDeleteEntryOptions = {
                    force: deleteOptions?.force === true,
                    permanently: deleteOptions?.permanently
                };
                const result = await context.container
                    .resolve(DeleteEntryUseCase)
                    .execute(model, revision, options);
                if (result.isFail()) {
                    throw result.error;
                }
            }

            return new Response(true);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
