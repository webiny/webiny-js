import { ErrorResponse } from "@webiny/api-graphql/responses.js";
import { Response } from "@webiny/api-graphql/responses.js";
import type { CmsEntryResolverFactory as ResolverFactory } from "~/types/index.js";
import { UnpublishSingletonEntryUseCase } from "~/features/contentEntry/UnpublishSingletonEntry/index.js";

interface ResolveUnpublishArgs {
    revision: string;
}

type ResolveUnpublish = ResolverFactory<any, ResolveUnpublishArgs>;

export const resolveUnpublish: ResolveUnpublish =
    ({ model }) =>
    async (_: unknown, args, context) => {
        const unpublishEntry = context.container.resolve(UnpublishSingletonEntryUseCase);
        const result = await unpublishEntry.execute(model, args.revision);
        if (result.isFail()) {
            return new ErrorResponse(result.error);
        }

        return new Response(result.value);
    };
