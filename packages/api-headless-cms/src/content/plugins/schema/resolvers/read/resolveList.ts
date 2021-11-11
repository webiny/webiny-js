import { ListResponse, ListErrorResponse } from "@webiny/handler-graphql/responses";
import {
    CmsContentEntryMeta,
    CmsContentEntryResolverFactory as ResolverFactory,
    CmsContentEntry
} from "~/types";

export const resolveList: ResolverFactory =
    ({ model }) =>
    async (_, args, { cms }) => {
        try {
            const response: [CmsContentEntry[], CmsContentEntryMeta] =
                await cms.entries.listPublishedEntries(model, args);

            return new ListResponse(...response);
        } catch (e) {
            return new ListErrorResponse(e);
        }
    };
