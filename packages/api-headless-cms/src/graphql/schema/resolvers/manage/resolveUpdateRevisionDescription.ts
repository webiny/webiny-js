import { ErrorResponse, Response } from "@webiny/handler-graphql/responses.js";
import type { CmsEntryResolverFactory as ResolverFactory } from "~/types/index.js";
import { UpdateRevisionDescriptionUseCase } from "~/features/contentEntry/UpdateRevisionDescription/index.js";

interface ResolveUpdateRevisionDescriptionArgs {
    revision: string;
    revisionDescription: string | undefined;
}
type ResolveUpdateRevisionDescription = ResolverFactory<any, ResolveUpdateRevisionDescriptionArgs>;

export const resolveUpdateRevisionDescription: ResolveUpdateRevisionDescription =
    ({ model }) =>
    async (_, args, context) => {
        try {
            const result = await context.container
                .resolve(UpdateRevisionDescriptionUseCase)
                .execute(model, args.revision, args.revisionDescription);
            if (result.isFail()) {
                throw result.error;
            }
            return new Response(result.value);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
