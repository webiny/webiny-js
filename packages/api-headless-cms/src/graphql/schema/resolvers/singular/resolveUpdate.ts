import { ErrorResponse } from "@webiny/api-graphql/responses.js";
import { Response } from "@webiny/api-graphql/responses.js";
import type { CmsEntryResolverFactory as ResolverFactory } from "~/types/index.js";
import type { UpdateCmsEntryInput } from "~/types/index.js";
import type { UpdateCmsEntryOptionsInput } from "~/types/index.js";
import { UpdateSingletonEntryUseCase } from "~/features/contentEntry/UpdateSingletonEntry/index.js";

interface ResolveUpdateArgs {
    revision: string;
    data: UpdateCmsEntryInput;
    options?: UpdateCmsEntryOptionsInput;
}

type ResolveUpdate = ResolverFactory<any, ResolveUpdateArgs>;

export const resolveUpdate: ResolveUpdate =
    ({ model }) =>
    async (_: unknown, args, context) => {
        const updateEntry = context.container.resolve(UpdateSingletonEntryUseCase);
        const result = await updateEntry.execute(model, args.revision, args.data, args.options);
        if (result.isFail()) {
            return new ErrorResponse(result.error);
        }

        return new Response(result.value);
    };
