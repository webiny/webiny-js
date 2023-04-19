import { Response, ListErrorResponse } from "@webiny/handler-graphql/responses";
import { CmsEntryResolverFactory as ResolverFactory, CmsEntryListParams } from "~/types";

type ResolveFieldUniqueList = ResolverFactory<any, CmsEntryListParams>;

export const resolveListFieldUniqueValues: ResolveFieldUniqueList =
    ({ model }) =>
    async (_, params: any, context) => {
        try {
            const response = await context.cms.listFieldUniqueValues(model, params);

            return new Response(response);
        } catch (e) {
            return new ListErrorResponse(e);
        }
    };
