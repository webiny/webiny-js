import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import {
    HeadlessCmsInitializerImpl,
    HeadlessCmsEnhancerConfig
} from "./HeadlessCmsContextEnhancer.js";
import { GraphQLContextEnhancer, GraphQLContextualSchema } from "@webiny/handler-graphql";
import { BenchmarkAbstraction } from "@webiny/api";
import { CompressionFeature } from "@webiny/utils/features/compression/feature.js";
import { GraphQLFeature } from "~/features/graphql/index.js";
import { ValidationFeature } from "~/features/validation/index.js";
import { StorageFeature } from "~/features/storage/index.js";
import { CmsInstallerFeature } from "~/features/installer/feature.js";
import { ContentEntriesFeature } from "~/features/contentEntry/ContentEntriesFeature.js";
import { ContentModelFeature } from "~/features/contentModel/ContentModelFeature.js";
import { ContentModelGroupFeature } from "~/features/contentModelGroup/ContentModelGroupFeature.js";
import { ModelBuilderFeature } from "~/features/modelBuilder/index.js";
import { CmsWhereMapperFeature } from "~/features/whereMapper/feature.js";
import { CmsSortMapperFeature } from "~/features/sortMapper/feature.js";
import { CmsWebhooksFeature } from "~/features/webhooks/feature.js";
import { HttpRoute, RequestContainer } from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler-core";
import type { IGraphQLContextEnhancer, IGraphQLContextualSchema } from "@webiny/handler-graphql";
import type { ApiEndpoint } from "~/types/index.js";
import { StorageOperationsFactory } from "~/features/shared/abstractions.js";
import { CmsBaseErrorTypeFactory } from "~/graphql/schema/cms/CmsBaseErrorTypeFactory.js";
import { CmsSchemaExecutor } from "~/graphql/CmsSchemaExecutor.js";
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

        constructor(
            private container: Container,
            private enhancers: IGraphQLContextEnhancer[],
            private contextualSchemas: IGraphQLContextualSchema[]
        ) {}

        async handle(request: IHttpRequest): Promise<IHttpResponse> {
            const ctx: Record<string, any> = { container: this.container };
            for (const enhancer of this.enhancers) {
                await enhancer.enhance(ctx);
            }
            for (const schema of this.contextualSchemas) {
                await schema.build(ctx);
            }
            const result = await this.container
                .resolve(CmsSchemaExecutor)
                .execute(type, request.body);
            // Flush benchmark measurements (no-op unless benchmarking was enabled for the request).
            await this.container.resolve(BenchmarkAbstraction).output();
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: result
            };
        }
    }

    return HttpRoute.createImplementation({
        implementation: CmsGraphQLRoute,
        dependencies: [
            RequestContainer,
            [GraphQLContextEnhancer, { multiple: true }],
            [GraphQLContextualSchema, { multiple: true }]
        ]
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

        // Register CMS DI features statically so they are available before any enhancers run.
        // All these are pure class registrations (no eager instantiation) so they are safe
        // to register here before any request-time context is available.
        CompressionFeature.register(container);
        GraphQLFeature.register(container);
        ValidationFeature.register(container);
        StorageFeature.register(container);
        CmsInstallerFeature.register(container);
        ContentEntriesFeature.register(container);
        ContentModelFeature.register(container);
        ContentModelGroupFeature.register(container);
        ModelBuilderFeature.register(container);
        CmsWhereMapperFeature.register(container);
        CmsSortMapperFeature.register(container);
        CmsWebhooksFeature.register(container);

        const initializer = container.resolveWithDependencies({
            implementation: HeadlessCmsInitializerImpl,
            dependencies: [
                RequestContainer,
                HeadlessCmsEnhancerConfig,
                IdentityContext,
                TenantContext
            ]
        });
        container.registerInstance(GraphQLContextualSchema, initializer);
        container.register(createCmsRoute(config.type));
    }
});
