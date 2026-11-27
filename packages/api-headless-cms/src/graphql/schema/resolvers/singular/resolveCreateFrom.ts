import { ErrorResponse } from "@webiny/api-graphql/responses.js";
import { Response } from "@webiny/api-graphql/responses.js";
import type { CmsEntryResolverFactory as ResolverFactory } from "~/types/index.js";
import type { CreateCmsEntryInput } from "~/types/index.js";
import type { CreateCmsEntryOptionsInput } from "~/types/index.js";
import { CreateSingletonEntryRevisionFromUseCase } from "~/features/contentEntry/CreateSingletonEntryRevisionFrom/index.js";

interface ResolveCreateFromArgs {
    revision: string;
    data?: CreateCmsEntryInput;
    options?: CreateCmsEntryOptionsInput;
}

type ResolveCreateFrom = ResolverFactory<any, ResolveCreateFromArgs>;

export const resolveCreateFrom: ResolveCreateFrom =
    ({ model }) =>
    async (_: unknown, args, context) => {
        const createRevisionFrom = context.container.resolve(
            CreateSingletonEntryRevisionFromUseCase
        );
        const result = await createRevisionFrom.execute(
            model,
            args.revision,
            args.data,
            args.options
        );
        if (result.isFail()) {
            return new ErrorResponse(result.error);
        }

        return new Response(result.value);
    };
