import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import {
    CmsEntryResolverFactory as ResolverFactory,
    CreateFromCmsEntryInput,
    CreateRevisionCmsEntryOptionsInput
} from "~/types";

interface ResolveCreateFromArgs {
    revision: string;
    data: CreateFromCmsEntryInput;
    options?: CreateRevisionCmsEntryOptionsInput;
}
type ResolveCreateFrom = ResolverFactory<any, ResolveCreateFromArgs>;

export const resolveCreateFrom: ResolveCreateFrom =
    ({ model }) =>
    async (_, args: any, context) => {
        try {
            const newRevision = await context.cms.createEntryRevisionFrom(
                model,
                args.revision,
                args.data || {},
                args.options
            );
            return new Response(newRevision);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
