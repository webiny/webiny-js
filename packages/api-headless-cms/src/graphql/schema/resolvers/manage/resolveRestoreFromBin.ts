import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { CmsEntryResolverFactory as ResolverFactory } from "~/types";

interface ResolveRestoreFromBinArgs {
    revision: string;
}

type ResolveRestoreFromBin = ResolverFactory<any, ResolveRestoreFromBinArgs>;

export const resolveRestoreFromBin: ResolveRestoreFromBin =
    ({ model }) =>
    async (_, args: any, context) => {
        const { revision } = args;
        try {
            if (!revision) {
                throw new Error(`The input value "revision" is required!`);
            }

            const entry = await context.cms.restoreEntryFromBin(model, revision);
            return new Response(entry);
        } catch (ex) {
            return new ErrorResponse(ex);
        }
    };
