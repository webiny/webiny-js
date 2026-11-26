import { ErrorResponse } from "@webiny/api-graphql/responses.js";
import { Response } from "@webiny/api-graphql/responses.js";
import type { CmsEntryResolverFactory as ResolverFactory } from "~/types/index.js";
import { DeleteSingletonEntryRevisionUseCase } from "~/features/contentEntry/DeleteSingletonEntryRevision/index.js";

/**
 * The `options` argument exists for signature parity with the regular manage SDL and is ignored,
 * as it is in the regular resolver for a revision id.
 */
interface ResolveDeleteArgs {
    revision: string;
}

type ResolveDelete = ResolverFactory<any, ResolveDeleteArgs>;

export const resolveDelete: ResolveDelete =
    ({ model }) =>
    async (_: unknown, args, context) => {
        const deleteRevision = context.container.resolve(DeleteSingletonEntryRevisionUseCase);
        const result = await deleteRevision.execute(model, args.revision);
        if (result.isFail()) {
            return new ErrorResponse(result.error);
        }

        return new Response(true);
    };
