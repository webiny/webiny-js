import { ListResponse, ListErrorResponse } from "@webiny/handler-graphql/responses";
import {
    CmsContentEntryMetaType,
    CmsContentEntryResolverFactoryType as ResolverFactory,
    CmsContentEntryType
} from "@webiny/api-headless-cms/types";

export const resolveList: ResolverFactory = ({ model }) => async (root, args, { cms }) => {
    try {
        let response: [CmsContentEntryType[], CmsContentEntryMetaType];

        if (cms.READ) {
            response = await cms.entries.listPublished(model, args);
        } else {
            response = await cms.entries.listLatest(model, args);
        }

        return new ListResponse(...response);
    } catch (e) {
        return new ListErrorResponse(e);
    }
};
