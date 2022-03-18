import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { CmsEntryResolverFactory as ResolverFactory, CreateCmsEntryInput } from "~/types";

interface ResolveCreateArgs {
    data: CreateCmsEntryInput;
}
type ResolveCreate = ResolverFactory<any, ResolveCreateArgs>;

export const resolveCreate: ResolveCreate =
    ({ model }) =>
    async (_, args: any, context) => {
        try {
            const entry = await context.cms.createEntry(model, args.data);

            return new Response(entry);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
