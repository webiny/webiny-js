import { ListResponse, ListErrorResponse } from "@webiny/handler-graphql/responses";
import {
    CmsContentModelEntryMetaType,
    CmsContentModelEntryResolverFactoryType as ResolverFactory,
    CmsContentModelEntryType
} from "@webiny/api-headless-cms/types";

export const resolveList: ResolverFactory = ({ model }) => async (root, args, { cms }) => {
    try {
        let response: [CmsContentModelEntryType[], CmsContentModelEntryMetaType];

        if (cms.READ) {
            response = await cms.entries.listPublished(model);
        } else {
            response = await cms.entries.listLatest(model);
        }

        return new ListResponse(...response);
    } catch (e) {
        return new ListErrorResponse(e);
    }
};
