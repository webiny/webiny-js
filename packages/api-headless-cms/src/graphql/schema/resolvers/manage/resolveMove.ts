import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { CmsEntryResolverFactory as ResolverFactory } from "~/types";

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
            await context.cms.moveEntry(model, revision, folderId);

            return new Response(true);
        } catch (ex) {
            return new ErrorResponse(ex);
        }
    };
