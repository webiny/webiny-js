import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { CmsEntryResolverFactory as ResolverFactory, UpdateCmsEntryInput } from "~/types";

interface ResolveUpdateArgs {
    revision?: string;
    data: UpdateCmsEntryInput;
}
type ResolveValidate = ResolverFactory<any, ResolveUpdateArgs>;

export const resolveValidate: ResolveValidate =
    ({ model }) =>
    async (_, args: any, context) => {
        try {
            const entry = await context.cms.validateEntry(model, args.revision, args.data);

            return new Response(entry);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
