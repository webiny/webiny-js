import { ErrorResponse, Response } from "@webiny/handler-graphql/responses.js";
import type { CmsEntryResolverFactory as ResolverFactory } from "~/types/index.js";

interface ResolveUpdateRevisionDescriptionArgs {
    revision: string;
    revisionDescription: string | undefined;
}
type ResolveUpdateRevisionDescription = ResolverFactory<any, ResolveUpdateRevisionDescriptionArgs>;

export const resolveUpdateRevisionDescription: ResolveUpdateRevisionDescription =
    ({ model }) =>
    async (_, args, context) => {
        try {
            const entry = await context.cms.updateRevisionDescription(
                model,
                args.revision,
                args.revisionDescription
            );

            return new Response(entry);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
