import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { CmsEntryResolverFactory as ResolverFactory, CmsEntry } from "~/types";

export const resolveGetByIds: ResolverFactory =
    ({ model }) =>
    async (_, args, { cms }) => {
        try {
            const response: CmsEntry[] = await cms.getEntriesByIds(model, args.revisions);

            return new Response(response);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
