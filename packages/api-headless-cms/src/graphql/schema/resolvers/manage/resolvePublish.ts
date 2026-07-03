import { ErrorResponse, Response } from "@webiny/handler-graphql/responses.js";
import type { CmsEntryResolverFactory as ResolverFactory } from "~/types/index.js";
import { PublishEntryUseCase } from "~/features/contentEntry/PublishEntry/index.js";

interface ResolvePublishArgs {
    revision: string;
}

type ResolvePublish = ResolverFactory<any, ResolvePublishArgs>;

export const resolvePublish: ResolvePublish =
    ({ model }) =>
    async (_, args: any, context) => {
        try {
            const result = await context.container
                .resolve(PublishEntryUseCase)
                .execute(model, args.revision);
            if (result.isFail()) {
                throw result.error;
            }
            return new Response(result.value);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
