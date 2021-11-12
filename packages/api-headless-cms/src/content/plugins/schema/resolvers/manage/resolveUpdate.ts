import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { CmsContentEntryResolverFactory as ResolverFactory } from "~/types";

type ResolveUpdate = ResolverFactory<any, { revision: string; data: Record<string, any> }>;

export const resolveUpdate: ResolveUpdate =
    ({ model }) =>
    async (_, args, { cms }) => {
        try {
            const entry = await cms.updateEntry(model, args.revision, args.data);

            return new Response(entry);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
