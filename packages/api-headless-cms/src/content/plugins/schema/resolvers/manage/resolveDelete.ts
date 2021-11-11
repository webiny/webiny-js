import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { CmsContentEntryResolverFactory as ResolverFactory } from "~/types";

export const resolveDelete: ResolverFactory =
    ({ model }) =>
    async (root, { revision }, { cms }) => {
        try {
            if (revision.includes("#")) {
                await cms.entries.deleteEntryRevision(model, revision);
            } else {
                await cms.entries.deleteEntry(model, revision);
            }

            return new Response(true);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
