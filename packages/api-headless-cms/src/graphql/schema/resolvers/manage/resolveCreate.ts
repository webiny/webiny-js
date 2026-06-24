import { ErrorResponse, Response } from "@webiny/handler-graphql/responses.js";
import type {
    CmsEntryResolverFactory as ResolverFactory,
    CreateCmsEntryInput,
    CreateCmsEntryOptionsInput
} from "~/types/index.js";
import { CreateEntryUseCase } from "~/features/contentEntry/CreateEntry/index.js";

interface ResolveCreateArgs {
    data: CreateCmsEntryInput;
    options?: CreateCmsEntryOptionsInput;
}
type ResolveCreate = ResolverFactory<any, ResolveCreateArgs>;

export const resolveCreate: ResolveCreate =
    ({ model }) =>
    async (_, args: any, context) => {
        try {
            const result = await context.container
                .resolve(CreateEntryUseCase)
                .execute(model, args.data, args.options);
            if (result.isFail()) {
                throw result.error;
            }
            return new Response(result.value);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
