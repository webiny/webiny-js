import { ErrorResponse, Response } from "@webiny/handler-graphql/responses.js";
import type { CmsEntryResolverFactory as ResolverFactory } from "~/types/index.js";
import { MoveEntryUseCase } from "~/features/contentEntry/MoveEntry/index.js";

interface ResolveMoveArgs {
    revision: string;
    folderId: string;
}

type ResolveMove = ResolverFactory<any, ResolveMoveArgs>;

export const resolveMove: ResolveMove =
    ({ model }) =>
    async (_, args: any, context) => {
        const { revision, folderId } = args;
        try {
            if (!folderId) {
                throw new Error(`The input value "folderId" is required!`);
            }
            const result = await context.container
                .resolve(MoveEntryUseCase)
                .execute(model, revision, folderId);
            if (result.isFail()) {
                throw result.error;
            }
            return new Response(true);
        } catch (ex) {
            return new ErrorResponse(ex);
        }
    };
