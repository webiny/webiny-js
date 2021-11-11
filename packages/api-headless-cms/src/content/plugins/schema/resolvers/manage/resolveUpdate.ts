import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { CmsContentEntryResolverFactory as ResolverFactory } from "~/types";

type ResolveUpdate = ResolverFactory<any, { revision: string; data: Record<string, any> }>;

export const resolveUpdate: ResolveUpdate =
    ({ model }) =>
    async (root, args, { cms }) => {
        try {
            const entry = await cms.entries.updateEntry(model, args.revision, args.data);

            return new Response(entry);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
