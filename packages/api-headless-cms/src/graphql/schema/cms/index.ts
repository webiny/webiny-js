import { ContextPlugin } from "@webiny/api";
import {
    CmsResponseTypeDefsImpl,
    CmsQueryTypeDefsImpl,
    CmsMutationTypeDefsImpl
} from "./typeDefs/index.js";
import {
    QueryCmsResolverImpl,
    MutationCmsResolverImpl,
    GetEntryResolverImpl,
    ListEntriesResolverImpl,
    CreateEntryResolverImpl,
    UpdateEntryRevisionResolverImpl,
    DeleteEntryRevisionResolverImpl,
    PublishEntryRevisionResolverImpl,
    UnpublishEntryRevisionResolverImpl
} from "./resolvers/index.js";

export const createCmsSchema = () => {
    const plugin = new ContextPlugin(async context => {
        // Register type definitions.
        context.container.register(CmsResponseTypeDefsImpl);
        context.container.register(CmsQueryTypeDefsImpl);
        context.container.register(CmsMutationTypeDefsImpl);

        // Register resolvers.
        context.container.register(QueryCmsResolverImpl);
        context.container.register(MutationCmsResolverImpl);
        context.container.register(GetEntryResolverImpl);
        context.container.register(ListEntriesResolverImpl);
        context.container.register(CreateEntryResolverImpl);
        context.container.register(UpdateEntryRevisionResolverImpl);
        context.container.register(DeleteEntryRevisionResolverImpl);
        context.container.register(PublishEntryRevisionResolverImpl);
        context.container.register(UnpublishEntryRevisionResolverImpl);
    });

    plugin.name = "headless-cms.graphql.createCmsSchema";

    return plugin;
};
