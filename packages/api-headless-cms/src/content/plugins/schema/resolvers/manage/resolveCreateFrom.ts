import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { CmsEntryResolverFactory as ResolverFactory, CreateFromCmsEntryInput } from "~/types";

interface ResolveCreateFromArgs {
    revision: string;
    data: CreateFromCmsEntryInput;
}
type ResolveCreateFrom = ResolverFactory<any, ResolveCreateFromArgs>;

export const resolveCreateFrom: ResolveCreateFrom =
    ({ model }) =>
    async (_, args: any, context) => {
        try {
            const newRevision = await context.cms.createEntryRevisionFrom(
                model,
                args.revision,
                args.data || {}
            );
            return new Response(newRevision);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
