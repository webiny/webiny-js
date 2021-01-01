import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import {
    CmsContentEntryResolverFactoryType as ResolverFactory,
    CmsContentEntryType
} from "@webiny/api-headless-cms/types";

export const resolveGetByIds: ResolverFactory = ({ model }) => async (root, args, { cms }) => {
    try {
        const response: CmsContentEntryType[] = await cms.entries.getByIds(model, args.revisions);

        return new Response(response);
    } catch (e) {
        return new ErrorResponse(e);
    }
};
