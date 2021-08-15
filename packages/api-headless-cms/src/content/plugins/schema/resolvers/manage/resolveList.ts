import { ListResponse, ListErrorResponse } from "@webiny/handler-graphql/responses";
import {
    CmsContentEntryMeta,
    CmsContentEntryResolverFactory as ResolverFactory,
    CmsContentEntry
} from "~/types";

export const resolveList: ResolverFactory =
    ({ model }) =>
    async (root, args, { cms }) => {
        try {
            const response: [CmsContentEntry[], CmsContentEntryMeta] = await cms.entries.listLatest(
                model,
                args
            );

            return new ListResponse(...response);
        } catch (e) {
            return new ListErrorResponse(e);
        }
    };
