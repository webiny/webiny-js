import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { CmsEntryResolverFactory as ResolverFactory } from "~/types";

type ResolveCreate = ResolverFactory<any, { data: Record<string, any> }>;

export const resolveCreate: ResolveCreate =
    ({ model }) =>
    async (_, args, { cms }) => {
        try {
            const entry = await cms.createEntry(model, args.data);

            return new Response(entry);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
