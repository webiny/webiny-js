import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import {
    CmsEntryResolverFactory as ResolverFactory,
    CreateCmsEntryInput,
    CreateCmsEntryOptionsInput
} from "~/types";

interface ResolveCreateArgs {
    data: CreateCmsEntryInput;
    options?: CreateCmsEntryOptionsInput;
}
type ResolveCreate = ResolverFactory<any, ResolveCreateArgs>;

export const resolveCreate: ResolveCreate =
    ({ model }) =>
    async (_, args: any, context) => {
        try {
            const entry = await context.cms.createEntry(model, args.data, args.options);

            return new Response(entry);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
