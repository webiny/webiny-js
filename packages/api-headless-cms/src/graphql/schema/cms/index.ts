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
    UpdateEntryResolverImpl,
    DeleteEntryResolverImpl,
    PublishEntryResolverImpl,
    UnpublishEntryResolverImpl
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
        context.container.register(UpdateEntryResolverImpl);
        context.container.register(DeleteEntryResolverImpl);
        context.container.register(PublishEntryResolverImpl);
        context.container.register(UnpublishEntryResolverImpl);
    });

    plugin.name = "headless-cms.graphql.createCmsSchema";

    return plugin;
};
