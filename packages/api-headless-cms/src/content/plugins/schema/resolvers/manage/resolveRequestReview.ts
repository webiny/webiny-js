import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { CmsEntryResolverFactory as ResolverFactory } from "~/types";

type ResolveRequestReview = ResolverFactory<any, { revision: string }>;

export const resolveRequestReview: ResolveRequestReview =
    ({ model }) =>
    async (_, args, { cms }) => {
        try {
            const entry = await cms.requestEntryReview(model, args.revision);

            return new Response(entry);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
