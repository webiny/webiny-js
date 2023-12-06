import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { CmsEntryResolverFactory as ResolverFactory, CmsPublishEntryOptions } from "~/types";

interface ResolvePublishArgs {
    revision: string;
    options?: CmsPublishEntryOptions;
}

type ResolvePublish = ResolverFactory<any, ResolvePublishArgs>;

export const resolvePublish: ResolvePublish =
    ({ model }) =>
    async (_, args: any, context) => {
        try {
            const entry = await context.cms.publishEntry(model, args.revision, args.options);
            return new Response(entry);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
