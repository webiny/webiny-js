import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { CmsContentEntryResolverFactoryType as ResolverFactory } from "@webiny/api-headless-cms/types";

export const resolveDelete: ResolverFactory = ({ model }) => async (
    root,
    { revision },
    { cms }
) => {
    try {
        if (revision.includes("#")) {
            await cms.entries.deleteRevision(model, revision);
        } else {
            await cms.entries.deleteEntry(model, revision);
        }

        return new Response(true);
    } catch (e) {
        return new ErrorResponse(e);
    }
};
