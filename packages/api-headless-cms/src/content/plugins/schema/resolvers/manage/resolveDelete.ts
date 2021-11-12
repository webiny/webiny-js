import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { CmsEntryResolverFactory as ResolverFactory } from "~/types";

export const resolveDelete: ResolverFactory =
    ({ model }) =>
    async (_, { revision }, { cms }) => {
        try {
            if (revision.includes("#")) {
                await cms.deleteEntryRevision(model, revision);
            } else {
                await cms.deleteEntry(model, revision);
            }

            return new Response(true);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
