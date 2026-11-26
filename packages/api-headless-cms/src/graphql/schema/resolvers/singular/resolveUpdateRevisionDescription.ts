import { ErrorResponse } from "@webiny/api-graphql/responses.js";
import { Response } from "@webiny/api-graphql/responses.js";
import type { CmsEntryResolverFactory as ResolverFactory } from "~/types/index.js";
import { UpdateSingletonEntryRevisionDescriptionUseCase } from "~/features/contentEntry/UpdateSingletonEntryRevisionDescription/index.js";

interface ResolveUpdateRevisionDescriptionArgs {
    revision: string;
    revisionDescription: string | undefined;
}

type ResolveUpdateRevisionDescription = ResolverFactory<any, ResolveUpdateRevisionDescriptionArgs>;

export const resolveUpdateRevisionDescription: ResolveUpdateRevisionDescription =
    ({ model }) =>
    async (_: unknown, args, context) => {
        const updateRevisionDescription = context.container.resolve(
            UpdateSingletonEntryRevisionDescriptionUseCase
        );
        const result = await updateRevisionDescription.execute(
            model,
            args.revision,
            args.revisionDescription
        );
        if (result.isFail()) {
            return new ErrorResponse(result.error);
        }

        return new Response(result.value);
    };
