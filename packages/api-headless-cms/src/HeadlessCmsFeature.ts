import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import { HeadlessCmsInitializerImpl, HeadlessCmsEnhancerConfig } from "./HeadlessCmsInitializer.js";
import { GraphQLContextInitializer, GraphQLContextualSchema } from "@webiny/handler-graphql";
import { createRequestBody, processRequestBody } from "@webiny/handler-graphql";
import { BenchmarkAbstraction } from "@webiny/api";
import { Benchmark } from "@webiny/api/Benchmark.js";
import { PluginsContainer } from "@webiny/plugins";
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
import type { IGraphQLContextInitializer, IGraphQLContextualSchema } from "@webiny/handler-graphql";
import type { ApiEndpoint, CmsContext } from "~/types/index.js";
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
// Facade wiring (moved here from HeadlessCmsInitializer so the facade can be a lazy DI factory).
import { AccessControl } from "~/crud/AccessControl/AccessControl.js";
import { createModelGroupsCrud } from "~/crud/contentModelGroup.crud.js";
import { createModelsCrud } from "~/crud/contentModel.crud.js";
import { createContentEntryCrud } from "~/crud/contentEntry.crud.js";
import type { ICmsGraphQLSchemaPlugin } from "~/plugins/index.js";
import {
    CmsGraphQLSchemaPlugin,
    CmsGroupPlugin,
    CmsModelPlugin,
    StorageOperationsCmsModelPlugin
} from "~/plugins/index.js";
import { createCmsModelFieldConvertersAttachFactory } from "~/utils/converters/valueKeyStorageConverter.js";
import { registerFieldConverters } from "~/fieldConverters/abstractions.js";
import { CmsModelPluginInstance } from "~/features/contentModel/shared/abstractions.js";
import { CmsGroupPluginInstance } from "~/features/contentModelGroup/shared/abstractions.js";
import { createExportCrud } from "~/export/index.js";
import { createImportCrud } from "~/export/crud/importing.js";
import { getSchema } from "~/graphql/getSchema.js";
import { createBaseSchemaPlugins } from "~/graphql/schema/baseSchema.js";
import { exportPlugin } from "~/export/graphql/index.js";
import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { CmsGraphQLSchemaFactory } from "~/graphql/CmsGraphQLSchemaFactory.js";
import { CmsExport, CmsImport } from "~/export/abstractions.js";
import { ListGroupsUseCase } from "~/features/contentModelGroup/ListGroups/index.js";
import { RevisionIdScalar } from "~/graphql/scalars/RevisionId.js";
import {
    AccessControl as AccessControlAbstraction,
    CmsContext as CmsContextAbstraction,
    CmsStorageModelProvider,
    HeadlessCms,
    StorageOperations,
    StorageOperationsFactory
} from "~/features/shared/abstractions.js";
import {
    EntryFromStorageTransform,
    EntryToStorageTransform,
    PluginsContainer as PluginsContainerAbstraction,
    SearchableFieldsProvider
} from "~/legacy/abstractions.js";
import { entryFromStorageTransform, entryToStorageTransform } from "~/utils/entryStorage.js";
import { getSearchableFields } from "~/crud/contentEntry/searchableFields.js";
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
            private initializers: IGraphQLContextInitializer[],
            private contextualSchemas: IGraphQLContextualSchema[]
        ) {}

        async handle(request: IHttpRequest): Promise<IHttpResponse> {
            const ctx: Record<string, any> = { container: this.container };
            // Request initializers (e.g. the CMS storage setup) run first, before any contextual
            // schema that depends on them.
            for (const initializer of this.initializers) {
                await initializer.init(ctx);
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
            [GraphQLContextInitializer, { multiple: true }],
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
        const { type } = config;

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

        // ============================================================================
        // Synchronous per-request wiring (moved out of HeadlessCmsInitializer.init).
        // register() runs per request, pre-auth — correct for pure wiring and closures.
        // ============================================================================

        // Field value converters are resolved from the DI container.
        registerFieldConverters(container);

        // PluginsContainer still carries legacy extension plugins (e.g. CmsGraphQLSchemaPlugin)
        // until those remaining consumers are migrated to DI.
        const pluginsContainer = new PluginsContainer([...(config.extraPlugins ?? [])]);
        container.registerInstance(PluginsContainerAbstraction, pluginsContainer);

        // Code-defined model/group plugins are exposed via DI tokens so the
        // Plugin{Models,Groups}Provider can resolve them without the plugins container.
        for (const plugin of pluginsContainer.byType<CmsModelPlugin>(CmsModelPlugin.type)) {
            container.registerInstance(CmsModelPluginInstance, plugin);
        }
        for (const plugin of pluginsContainer.byType<CmsGroupPlugin>(CmsGroupPlugin.type)) {
            container.registerInstance(CmsGroupPluginInstance, plugin);
        }

        // User-provided GraphQL schema extension plugins (added via extraPlugins) are bridged
        // to the CmsGraphQLSchemaFactory DI token so generateSchema includes them.
        const userSchemaPlugins = pluginsContainer.byType<ICmsGraphQLSchemaPlugin>(
            CmsGraphQLSchemaPlugin.type
        );
        if (userSchemaPlugins.length > 0) {
            container.registerInstance(CmsGraphQLSchemaFactory, {
                execute: () => userSchemaPlugins
            });
        }

        const benchmark = new Benchmark();
        container.registerInstance(BenchmarkAbstraction, benchmark);

        // The CmsContext "shim": the request-scoped context object the facade builders, transforms
        // and getSchema operate on. They only read `.container` (+ plugins/benchmark), so this is
        // all they need — there is no legacy bag.
        const cmsContext = {
            container,
            plugins: pluginsContainer,
            benchmark
        } as unknown as CmsContext;
        container.registerInstance(CmsContextAbstraction, cmsContext);

        container.registerInstance(CoreGraphQLSchemaFactory, {
            execute: async builder => {
                builder.addTypeDefs("scalar RevisionId");
                builder.addLegacyResolvers({ RevisionId: RevisionIdScalar });
                return builder;
            }
        });

        container.registerInstance(
            CmsStorageModelProvider,
            new StorageOperationsCmsModelPlugin(
                createCmsModelFieldConvertersAttachFactory(cmsContext)
            )
        );

        const identityContext = container.resolve(IdentityContext);
        const tenantContext = container.resolve(TenantContext);
        const getTenant = () => tenantContext.getTenant();

        // AccessControl is identity-dependent; build it lazily and memoise per request container.
        let accessControlInstance: AccessControl | undefined;
        const getAccessControl = (): AccessControl => {
            if (!accessControlInstance) {
                accessControlInstance = new AccessControl({
                    getIdentity: async () => identityContext.getIdentity(),
                    getGroupsPermissions: () =>
                        identityContext.getPermissions("cms.contentModelGroup"),
                    getModelsPermissions: () => identityContext.getPermissions("cms.contentModel"),
                    getEntriesPermissions: () => identityContext.getPermissions("cms.contentEntry"),
                    listAllGroups: async () => {
                        const result = await identityContext.withoutAuthorization(() =>
                            container.resolve(ListGroupsUseCase).execute()
                        );
                        if (result.isFail()) {
                            throw result.error;
                        }
                        return result.value;
                    }
                });
            }
            return accessControlInstance;
        };
        container.registerFactory(AccessControlAbstraction, () => getAccessControl());

        // The HeadlessCms facade — a LAZY factory built on first resolve (post-auth), memoised per
        // request container. StorageOperations is resolved here; it is built eagerly (async) by the
        // initializer below before resolvers run.
        let cmsFacade: HeadlessCms.Interface | undefined;
        container.registerFactory(HeadlessCms, () => {
            if (!cmsFacade) {
                cmsFacade = {
                    type,
                    READ: type === "read",
                    PREVIEW: type === "preview",
                    MANAGE: type === "manage",
                    storageOperations: container.resolve(StorageOperations),
                    accessControl: getAccessControl(),
                    ...createModelGroupsCrud({ context: cmsContext }),
                    ...createModelsCrud({ context: cmsContext }),
                    ...createContentEntryCrud({ context: cmsContext }),
                    export: { ...createExportCrud(cmsContext) },
                    importing: { ...createImportCrud(cmsContext) }
                } as HeadlessCms.Interface;
            }
            return cmsFacade;
        });
        container.registerFactory(CmsExport, () => container.resolve(HeadlessCms).export);
        container.registerFactory(CmsImport, () => container.resolve(HeadlessCms).importing);

        // Register CmsSchemaExecutor so proxy resolvers can build and execute the CMS sub-schema.
        container.registerInstance(CmsSchemaExecutor, {
            execute: async (schemaType: ApiEndpoint, body: any) => {
                const bm = container.resolve(BenchmarkAbstraction);
                const schema = await bm.measure("headlessCms.graphql.getSchema", () =>
                    identityContext.withoutAuthorization(() =>
                        getSchema({ context: cmsContext, getTenant, type: schemaType })
                    )
                );
                const requestBody = await bm.measure(
                    "headlessCms.graphql.createRequestBody",
                    async () => createRequestBody(body)
                );
                return bm.measure("headlessCms.graphql.processRequestBody", () =>
                    processRequestBody(requestBody, schema, cmsContext)
                );
            }
        });

        // Register CMS sub-schema factories: base types (CmsError, CmsIdentity, etc.)
        // and, for manage endpoints, the import/export operations.
        container.registerInstance(CmsGraphQLSchemaFactory, {
            execute: () => createBaseSchemaPlugins(cmsContext)
        });
        if (type === "manage") {
            container.registerInstance(CmsGraphQLSchemaFactory, {
                execute: () => [exportPlugin]
            });
        }

        container.registerInstance(EntryToStorageTransform, (model, entry) => {
            return entryToStorageTransform(cmsContext, model, entry);
        });
        container.registerInstance(EntryFromStorageTransform, (model, entry) => {
            return entryFromStorageTransform(cmsContext, model, entry);
        });
        container.registerInstance(SearchableFieldsProvider, params => {
            return getSearchableFields({
                context: cmsContext,
                fields: params.fields,
                input: []
            });
        });

        // The remaining async, per-request setup (storage operations + extraPlugins ContextPlugins)
        // is driven by the initializer, which runs before resolvers.
        const initializer = container.resolveWithDependencies({
            implementation: HeadlessCmsInitializerImpl,
            dependencies: [RequestContainer]
        });
        container.registerInstance(GraphQLContextInitializer, initializer);
        container.register(createCmsRoute(config.type));
    }
});
