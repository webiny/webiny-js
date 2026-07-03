import { Response, ErrorResponse } from "@webiny/handler-graphql/responses.js";
import type {
    CmsEntryResolverFactory as ResolverFactory,
    UpdateCmsEntryInput
} from "~/types/index.js";
import { ValidateEntryUseCase } from "~/features/contentEntry/ValidateEntry/index.js";

interface ResolveUpdateArgs {
    revision?: string;
    data: UpdateCmsEntryInput;
}
type ResolveValidate = ResolverFactory<any, ResolveUpdateArgs>;

export const resolveValidate: ResolveValidate =
    ({ model }) =>
    async (_, args: any, context) => {
        try {
            const result = await context.container
                .resolve(ValidateEntryUseCase)
                .execute(model, args.revision, args.data);
            if (result.isFail()) {
                throw result.error;
            }
            return new Response(result.value);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
