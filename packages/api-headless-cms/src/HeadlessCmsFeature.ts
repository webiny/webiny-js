import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import {
    HeadlessCmsContextEnhancerImpl,
    HeadlessCmsEnhancerConfig
} from "./HeadlessCmsContextEnhancer.js";
import { GraphQLContextEnhancer } from "@webiny/handler-graphql";
import { GraphQLEngine } from "@webiny/handler-graphql/engine/abstractions.js";
import { HttpRoute, RequestContainer } from "@webiny/event-handler-core";
import { HeadlessCmsContextualSchema } from "./HeadlessCmsContextualSchema.js";
import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler-core";
import type { IGraphQLEngine } from "@webiny/handler-graphql/engine/abstractions.js";
import type { ApiEndpoint } from "~/types/index.js";
import { StorageOperationsFactory } from "~/features/shared/abstractions.js";
import { CmsBaseErrorTypeFactory } from "~/graphql/schema/cms/CmsBaseErrorTypeFactory.js";
import {
    CmsResponseTypeDefsImpl,
    CmsQueryTypeDefsImpl,
    CmsMutationTypeDefsImpl
} from "~/graphql/schema/cms/typeDefs/index.js";
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
} from "~/graphql/schema/cms/resolvers/index.js";
import type { IHeadlessCmsStorageOperationsFactory } from "~/features/shared/abstractions.js";

const CMS_PATHS: Record<ApiEndpoint, string> = {
    manage: "/cms/manage",
    read: "/cms/read",
    preview: "/cms/preview"
};

function createCmsRoute(type: ApiEndpoint) {
    class CmsGraphQLRoute implements HttpRoute.Interface {
        readonly method = "POST";
        readonly path = CMS_PATHS[type];

        constructor(private engine: IGraphQLEngine) {}

        async handle(request: IHttpRequest): Promise<IHttpResponse> {
            const result = await this.engine.execute(request.body);
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: result
            };
        }
    }

    return HttpRoute.createImplementation({
        implementation: CmsGraphQLRoute,
        dependencies: [GraphQLEngine]
    });
}

export interface HeadlessCmsConfig {
    /**
     * Optional: if provided, registers the factory directly.
     * If omitted, expects StorageOperationsFactory to be registered externally.
     */
    storageOperations?: IHeadlessCmsStorageOperationsFactory<any>;
    type: ApiEndpoint;
    /** Extra plugins (e.g. CmsGraphQLSchemaPlugin) to register in ctx.plugins at runtime. */
    extraPlugins?: any[];
}

export const HeadlessCmsFeature = createFeature({
    name: "HeadlessCms",
    register(container: Container, config: HeadlessCmsConfig) {
        if (config.storageOperations) {
            container.registerInstance(StorageOperationsFactory, config.storageOperations);
        }

        // Pre-register the CMS SDK namespace schema (Query.cms / Mutation.cms) so it is
        // available when GraphQLSchemaComposer is constructed (before context enhancement).
        // All these implementations have zero DI dependencies and are safe to register early.
        container.register(CmsBaseErrorTypeFactory); // CmsError must come first
        container.register(CmsResponseTypeDefsImpl);
        container.register(CmsQueryTypeDefsImpl);
        container.register(CmsMutationTypeDefsImpl);
        container.register(QueryCmsResolverImpl);
        container.register(MutationCmsResolverImpl);
        container.register(GetEntryResolverImpl);
        container.register(ListEntriesResolverImpl);
        container.register(CreateEntryResolverImpl);
        container.register(UpdateEntryRevisionResolverImpl);
        container.register(DeleteEntryRevisionResolverImpl);
        container.register(PublishEntryRevisionResolverImpl);
        container.register(UnpublishEntryRevisionResolverImpl);

        container.registerInstance(HeadlessCmsEnhancerConfig, {
            type: config.type,
            extraPlugins: config.extraPlugins
        });
        // Use registerInstance (not register) so that HeadlessCmsContextEnhancer is an
        // instance registration. Instance registrations are resolved before class registrations
        // in resolveAll(), ensuring this enhancer runs first — before any other feature
        // enhancers that depend on ctx.cms or CmsContext being set.
        const enhancer = container.resolveWithDependencies({
            implementation: HeadlessCmsContextEnhancerImpl,
            dependencies: [RequestContainer, HeadlessCmsEnhancerConfig]
        });
        container.registerInstance(GraphQLContextEnhancer, enhancer);
        container.register(HeadlessCmsContextualSchema);
        container.register(createCmsRoute(config.type));
    }
});
