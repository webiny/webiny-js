import { ListResponse, ListErrorResponse } from "@webiny/handler-graphql/responses";
import {
    CmsContentEntryMetaType,
    CmsContentEntryResolverFactoryType as ResolverFactory,
    CmsContentEntryType
} from "@webiny/api-headless-cms/types";

export const resolveList: ResolverFactory = ({ model }) => async (root, args, { cms }) => {
    try {
        const response: [
            CmsContentEntryType[],
            CmsContentEntryMetaType
        ] = await cms.entries.listPublished(model, args);

        return new ListResponse(...response);
    } catch (e) {
        return new ListErrorResponse(e);
    }
};
