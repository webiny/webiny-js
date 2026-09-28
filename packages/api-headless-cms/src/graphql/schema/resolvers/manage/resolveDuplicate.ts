import { ErrorResponse, Response } from "@webiny/handler-graphql/responses.js";
import type { CmsEntryResolverFactory as ResolverFactory } from "~/types/index.js";

interface ResolveDuplicateArgs {
    revision: string;
}
type ResolveDuplicate = ResolverFactory<any, ResolveDuplicateArgs>;

export const resolveDuplicate: ResolveDuplicate =
    ({ model }) =>
    async (_, args: any, context) => {
        try {
            const entry = await context.cms.duplicateEntry(model, args.revision);
            return new Response(entry);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
