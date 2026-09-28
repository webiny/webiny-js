import { ErrorResponse, Response } from "@webiny/handler-graphql/responses.js";
import type { CmsEntryResolverFactory as ResolverFactory } from "~/types/index.js";
import { DuplicateEntryUseCase } from "~/features/contentEntry/DuplicateEntry/index.js";

interface ResolveDuplicateArgs {
    revision: string;
}
type ResolveDuplicate = ResolverFactory<any, ResolveDuplicateArgs>;

export const resolveDuplicate: ResolveDuplicate =
    ({ model }) =>
    async (_, args: any, context) => {
        const duplicateEntry = context.container.resolve(DuplicateEntryUseCase);
        const entry = await duplicateEntry.execute(model, args.revision);

        if (entry.isFail()) {
            return new ErrorResponse(entry.error);
        }

        return new Response(entry.value);
    };
