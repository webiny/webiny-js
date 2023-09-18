import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import {
    CmsEntryCreateOptions,
    CmsEntryResolverFactory as ResolverFactory,
    CreateCmsEntryInput
} from "~/types";

interface ResolveCreateArgs {
    data: CreateCmsEntryInput;
    options?: CmsEntryCreateOptions;
}
type ResolveCreate = ResolverFactory<any, ResolveCreateArgs>;

export const resolveCreate: ResolveCreate =
    ({ model }) =>
    async (_, args, context) => {
        try {
            const entry = await context.cms.createEntry(model, args.data, args.options);

            return new Response(entry);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
