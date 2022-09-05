import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { CmsEntryResolverFactory as ResolverFactory } from "~/types";

interface ResolvePublishArgs {
    revision: string;
}

type ResolvePublish = ResolverFactory<any, ResolvePublishArgs>;

export const resolvePublish: ResolvePublish =
    ({ model }) =>
    async (_, args: any, context) => {
        try {
            const entry = await context.cms.publishEntry(model, args.revision);
            return new Response(entry);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
