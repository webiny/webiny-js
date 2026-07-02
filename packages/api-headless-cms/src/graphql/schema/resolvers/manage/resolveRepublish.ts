import { Response, ErrorResponse } from "@webiny/handler-graphql/responses.js";
import type { CmsEntryResolverFactory as ResolverFactory } from "~/types/index.js";
import { RepublishEntryUseCase } from "~/features/contentEntry/RepublishEntry/index.js";

interface ResolveRepublishArgs {
    revision: string;
}
type ResolveRepublish = ResolverFactory<any, ResolveRepublishArgs>;

export const resolveRepublish: ResolveRepublish =
    ({ model }) =>
    async (_, args: any, context) => {
        try {
            const result = await context.container
                .resolve(RepublishEntryUseCase)
                .execute(model, args.revision);
            if (result.isFail()) {
                throw result.error;
            }
            return new Response(result.value);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
