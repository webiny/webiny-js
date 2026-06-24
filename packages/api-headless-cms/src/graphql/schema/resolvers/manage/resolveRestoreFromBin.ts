import { ErrorResponse, Response } from "@webiny/handler-graphql/responses.js";
import type { CmsEntryResolverFactory as ResolverFactory } from "~/types/index.js";
import { RestoreEntryFromBinUseCase } from "~/features/contentEntry/RestoreEntryFromBin/index.js";

interface ResolveRestoreFromBinArgs {
    revision: string;
}

type ResolveRestoreFromBin = ResolverFactory<any, ResolveRestoreFromBinArgs>;

export const resolveRestoreFromBin: ResolveRestoreFromBin =
    ({ model }) =>
    async (_, args: any, context) => {
        try {
            const result = await context.container
                .resolve(RestoreEntryFromBinUseCase)
                .execute(model, args.revision);
            if (result.isFail()) {
                throw result.error;
            }
            return new Response(result.value);
        } catch (ex) {
            return new ErrorResponse(ex);
        }
    };
