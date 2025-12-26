import { ErrorResponse, Response } from "@webiny/handler-graphql/responses.js";
import type {
    CmsEntryResolverFactory as ResolverFactory,
    UpdateCmsEntryInput,
    UpdateCmsEntryOptionsInput
} from "~/types/index.js";
import { UpdateSingletonEntryUseCase } from "~/features/contentEntry/UpdateSingletonEntry/index.js";

interface ResolveUpdateArgs {
    data: UpdateCmsEntryInput;
    options?: UpdateCmsEntryOptionsInput;
}

type ResolveUpdate = ResolverFactory<any, ResolveUpdateArgs>;

export const resolveUpdate: ResolveUpdate =
    ({ model }) =>
    async (_: unknown, args, context) => {
        const updateEntry = await context.container.resolve(UpdateSingletonEntryUseCase);
        const entry = await updateEntry.execute(model, args.data, args.options);

        if (entry.isFail()) {
            return new ErrorResponse(entry.error);
        }

        return new Response(entry.value);
    };
