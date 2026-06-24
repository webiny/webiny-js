import { ErrorResponse, Response } from "@webiny/handler-graphql/responses.js";
import type { CmsEntryResolverFactory as ResolverFactory } from "~/types/index.js";
import { GetEntriesByIdsUseCase } from "~/features/contentEntry/GetEntriesByIds/index.js";

interface ResolveGetByIdsArgs {
    revisions: string[];
}
type ResolveGetByIds = ResolverFactory<any, ResolveGetByIdsArgs>;

export const resolveGetByIds: ResolveGetByIds =
    ({ model }) =>
    async (_, args: any, context) => {
        try {
            const result = await context.container
                .resolve(GetEntriesByIdsUseCase)
                .execute(model, args.revisions);
            if (result.isFail()) {
                throw result.error;
            }
            return new Response(result.value);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
