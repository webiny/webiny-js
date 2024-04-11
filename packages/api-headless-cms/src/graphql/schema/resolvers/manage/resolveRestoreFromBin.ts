import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { CmsEntryResolverFactory as ResolverFactory } from "~/types";

interface ResolveRestoreFromBinArgs {
    revision: string;
}

type ResolveRestoreFromBin = ResolverFactory<any, ResolveRestoreFromBinArgs>;

export const resolveRestoreFromBin: ResolveRestoreFromBin =
    ({ model }) =>
    async (_, args: any, context) => {
        try {
            const entry = await context.cms.restoreEntryFromBin(model, args.revision);
            return new Response(entry);
        } catch (ex) {
            return new ErrorResponse(ex);
        }
    };
