import { ListResponse, ListErrorResponse } from "@webiny/handler-graphql/responses";
import { CmsEntryMeta, CmsEntryResolverFactory as ResolverFactory, CmsEntry } from "~/types";

export const resolveList: ResolverFactory =
    ({ model }) =>
    async (_, args, { cms }) => {
        try {
            const response: [CmsEntry[], CmsEntryMeta] = await cms.listPublishedEntries(
                model,
                args
            );

            return new ListResponse(...response);
        } catch (e) {
            return new ListErrorResponse(e);
        }
    };
