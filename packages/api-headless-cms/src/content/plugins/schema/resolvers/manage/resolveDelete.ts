import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { CmsEntryResolverFactory as ResolverFactory } from "~/types";
import { parseIdentifier } from "@webiny/utils";

export const resolveDelete: ResolverFactory =
    ({ model }) =>
    async (_, { revision }, { cms }) => {
        try {
            const { version } = parseIdentifier(revision);
            if (version) {
                await cms.deleteEntryRevision(model, revision);
            } else {
                await cms.deleteEntry(model, revision);
            }

            return new Response(true);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
