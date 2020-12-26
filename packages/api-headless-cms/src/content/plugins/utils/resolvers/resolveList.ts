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
            response = await cms.entries.listPublished(model, args);
        }
        // when id_in sent we go directly to the database
        else if (args.ids && Array.isArray(args.ids) === true) {
            response = await cms.entries.listIdIn(model, args.ids);
        } else {
            response = await cms.entries.listLatest(model, args);
        }

        return new ListResponse(...response);
    } catch (e) {
        return new ListErrorResponse(e);
    }
};
