import { ErrorResponse } from "@webiny/api-graphql/responses.js";
import { Response } from "@webiny/api-graphql/responses.js";
import type { CmsEntryResolverFactory as ResolverFactory } from "~/types/index.js";
import { PublishSingletonEntryUseCase } from "~/features/contentEntry/PublishSingletonEntry/index.js";

interface ResolvePublishArgs {
    revision: string;
}

type ResolvePublish = ResolverFactory<any, ResolvePublishArgs>;

export const resolvePublish: ResolvePublish =
    ({ model }) =>
    async (_: unknown, args, context) => {
        const publishEntry = context.container.resolve(PublishSingletonEntryUseCase);
        const result = await publishEntry.execute(model, args.revision);
        if (result.isFail()) {
            return new ErrorResponse(result.error);
        }

        return new Response(result.value);
    };
