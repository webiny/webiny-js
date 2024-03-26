import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { CmsEntryResolverFactory as ResolverFactory } from "~/types";

interface ResolveRestoreArgs {
    revision: string;
}

type ResolveRestore = ResolverFactory<any, ResolveRestoreArgs>;

export const resolveRestore: ResolveRestore =
    ({ model }) =>
    async (_, args: any, context) => {
        const { revision } = args;
        try {
            if (!revision) {
                throw new Error(`The input value "revision" is required!`);
            }
            await context.cms.restoreEntry(model, revision);

            return new Response(true);
        } catch (ex) {
            return new ErrorResponse(ex);
        }
    };
