import { Response, ErrorResponse } from "@webiny/handler-graphql/responses.js";
import type { CmsEntryResolverFactory as ResolverFactory } from "~/types/index.js";
import { UnpublishEntryUseCase } from "~/features/contentEntry/UnpublishEntry/index.js";

interface ResolveUnpublishArgs {
    revision: string;
}
type ResolveUnpublish = ResolverFactory<any, ResolveUnpublishArgs>;

export const resolveUnpublish: ResolveUnpublish =
    ({ model }) =>
    async (_, args: any, context) => {
        try {
            const result = await context.container
                .resolve(UnpublishEntryUseCase)
                .execute(model, args.revision);
            if (result.isFail()) {
                throw result.error;
            }
            return new Response(result.value);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
