import { ListErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { CmsEntryListParams, CmsEntryResolverFactory as ResolverFactory } from "~/types";

type ResolveGetUniqueFieldValuesList = ResolverFactory<any, CmsEntryListParams>;

export const resolveGetUniqueFieldValues: ResolveGetUniqueFieldValuesList =
    ({ model }) =>
    async (_, params: any, context) => {
        try {
            const response = await context.cms.getUniqueFieldValues(model, params);

            return new Response(response);
        } catch (e) {
            return new ListErrorResponse(e);
        }
    };
