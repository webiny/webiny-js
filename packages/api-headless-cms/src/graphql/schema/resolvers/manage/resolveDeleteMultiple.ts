import { ErrorResponse, ListResponse } from "@webiny/handler-graphql/responses";
import { CmsEntryResolverFactory as ResolverFactory } from "~/types";

interface ResolveDeleteArgs {
    revision: string;
}

type ResolveDelete = ResolverFactory<any, ResolveDeleteArgs>;

export const resolveDeleteMultiple: ResolveDelete =
    ({ model }) =>
    async (_, args: any, context) => {
        try {
            const response = await context.cms.deleteMultipleEntries(model, {
                entries: args?.entries || []
            });

            return new ListResponse(response);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
