import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { CmsContentEntryResolverFactory as ResolverFactory } from "~/types";

type ResolveRequestChanges = ResolverFactory<any, { revision: string }>;

export const resolveRequestChanges: ResolveRequestChanges =
    ({ model }) =>
    async (root, args, { cms }) => {
        try {
            const entry = await cms.entries.requestEntryChanges(model, args.revision);

            return new Response(entry);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
