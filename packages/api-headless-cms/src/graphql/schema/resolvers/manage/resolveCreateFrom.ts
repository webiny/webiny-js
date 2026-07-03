import { ErrorResponse, Response } from "@webiny/handler-graphql/responses.js";
import type {
    CmsEntryResolverFactory as ResolverFactory,
    CreateFromCmsEntryInput,
    CreateRevisionCmsEntryOptionsInput
} from "~/types/index.js";
import { CreateEntryRevisionFromUseCase } from "~/features/contentEntry/CreateEntryRevisionFrom/index.js";

interface ResolveCreateFromArgs {
    revision: string;
    data: CreateFromCmsEntryInput;
    options?: CreateRevisionCmsEntryOptionsInput;
}
type ResolveCreateFrom = ResolverFactory<any, ResolveCreateFromArgs>;

export const resolveCreateFrom: ResolveCreateFrom =
    ({ model }) =>
    async (_, args: any, context) => {
        try {
            const result = await context.container
                .resolve(CreateEntryRevisionFromUseCase)
                .execute(model, args.revision, args.data || {}, args.options);
            if (result.isFail()) {
                throw result.error;
            }
            return new Response(result.value);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
