import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { CmsContentEntryResolverFactory as ResolverFactory, CmsContentEntry } from "~/types";

export const resolveGetByIds: ResolverFactory =
    ({ model }) =>
    async (root, args, { cms }) => {
        try {
            const response: CmsContentEntry[] = await cms.entries.getEntriesByIds(
                model,
                args.revisions
            );

            return new Response(response);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
