import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { CmsEntryResolverFactory as ResolverFactory, CmsEntry } from "~/types";

interface ResolveGetByIdsArgs {
    revisions: string[];
}
type ResolveGetByIds = ResolverFactory<any, ResolveGetByIdsArgs>;

export const resolveGetByIds: ResolveGetByIds =
    ({ model }) =>
    async (_, args: any, context) => {
        try {
            const response: CmsEntry[] = await context.cms.getEntriesByIds(model, args.revisions);

            return new Response(response);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
