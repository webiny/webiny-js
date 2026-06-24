import { ListErrorResponse, Response } from "@webiny/handler-graphql/responses.js";
import type {
    CmsEntryListParams,
    CmsEntryResolverFactory as ResolverFactory
} from "~/types/index.js";
import { GetUniqueFieldValuesUseCase } from "~/features/contentEntry/GetUniqueFieldValues/index.js";

type ResolveGetUniqueFieldValuesList = ResolverFactory<any, CmsEntryListParams>;

export const resolveGetUniqueFieldValues: ResolveGetUniqueFieldValuesList =
    ({ model }) =>
    async (_, params: any, context) => {
        try {
            const result = await context.container
                .resolve(GetUniqueFieldValuesUseCase)
                .execute(model, params);
            if (result.isFail()) {
                throw result.error;
            }
            return new Response(result.value);
        } catch (e) {
            return new ListErrorResponse(e);
        }
    };
