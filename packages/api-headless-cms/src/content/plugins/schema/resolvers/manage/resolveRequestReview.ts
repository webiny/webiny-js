import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { CmsEntryResolverFactory as ResolverFactory } from "~/types";

interface ResolveRequestReviewArgs {
    revision: string;
}
type ResolveRequestReview = ResolverFactory<any, ResolveRequestReviewArgs>;

export const resolveRequestReview: ResolveRequestReview =
    ({ model }) =>
    async (_, args: any, context) => {
        try {
            const entry = await context.cms.requestEntryReview(model, args.revision);

            return new Response(entry);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
