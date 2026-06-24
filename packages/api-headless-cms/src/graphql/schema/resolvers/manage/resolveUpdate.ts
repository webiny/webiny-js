import { ErrorResponse, Response } from "@webiny/handler-graphql/responses.js";
import type {
    CmsEntryResolverFactory as ResolverFactory,
    UpdateCmsEntryInput,
    UpdateCmsEntryOptionsInput
} from "~/types/index.js";
import { UpdateEntryUseCase } from "~/features/contentEntry/UpdateEntry/index.js";

interface ResolveUpdateArgs {
    revision: string;
    data: UpdateCmsEntryInput;
    options?: UpdateCmsEntryOptionsInput;
}
type ResolveUpdate = ResolverFactory<any, ResolveUpdateArgs>;

export const resolveUpdate: ResolveUpdate =
    ({ model }) =>
    async (_, args, context) => {
        try {
            const result = await context.container
                .resolve(UpdateEntryUseCase)
                .execute(model, args.revision, args.data, args.options);
            if (result.isFail()) {
                throw result.error;
            }
            return new Response(result.value);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
