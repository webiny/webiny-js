import type { Container } from "@webiny/di";
import { Abstraction } from "@webiny/di";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import { PluginsContainer } from "@webiny/plugins";
import { makeExecutableSchema } from "@graphql-tools/schema";
import type { IGraphQLContextualSchema } from "@webiny/handler-graphql";
import type { GraphQLSchema } from "graphql";
import { AccessControl } from "~/crud/AccessControl/AccessControl.js";
import { createModelGroupsCrud } from "~/crud/contentModelGroup.crud.js";
import { createModelsCrud } from "~/crud/contentModel.crud.js";
import { createContentEntryCrud } from "~/crud/contentEntry.crud.js";
import { StorageOperationsCmsModelPlugin } from "~/plugins/index.js";
import { createCmsModelFieldConvertersAttachFactory } from "~/utils/converters/valueKeyStorageConverter.js";
import { createFieldConverters } from "~/fieldConverters/index.js";
import { createExportCrud } from "~/export/index.js";
import { createImportCrud } from "~/export/crud/importing.js";
import { getSchema } from "~/graphql/getSchema.js";
import { processRequestBody } from "@webiny/handler-graphql";
import { Benchmark } from "@webiny/api/Benchmark.js";
import { BenchmarkAbstraction } from "@webiny/api";
import { createBaseSchemaPlugins } from "~/graphql/schema/baseSchema.js";
import { exportPlugin } from "~/export/graphql/index.js";
import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { CmsGraphQLSchemaFactory } from "~/graphql/CmsGraphQLSchemaFactory.js";
import { RevisionIdScalar } from "~/graphql/scalars/RevisionId.js";
import {
    AccessControl as AccessControlAbstraction,
    CmsContext as CmsContextAbstraction,
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
import type { ApiEndpoint, CmsContext } from "~/types/index.js";

export interface IHeadlessCmsEnhancerConfig {
    type: ApiEndpoint;
    extraPlugins?: any[];
}

export const HeadlessCmsEnhancerConfig = new Abstraction<IHeadlessCmsEnhancerConfig>(
    "HeadlessCmsEnhancerConfig"
);

export class HeadlessCmsInitializerImpl implements IGraphQLContextualSchema {
    private initialized = false;

    constructor(
        private container: Container,
        private config: IHeadlessCmsEnhancerConfig,
        private identityContext: IdentityContext.Interface,
        private tenantContext: TenantContext.Interface
    ) {}

    async build(ctx: Record<string, any>): Promise<GraphQLSchema> {
        if (!this.initialized) {
            this.initialized = true;
            await this._initialize(ctx);
        }
        return makeExecutableSchema({
            typeDefs: "type Query\ntype Mutation",
            assumeValidSDL: true
        });
    }

    private async _initialize(ctx: Record<string, any>): Promise<void> {
        const { type } = this.config;

        // Provide a PluginsContainer with field converters and required scalar plugins
        ctx.plugins = new PluginsContainer([
            ...createFieldConverters(),
            ...(this.config.extraPlugins ?? [])
        ]);

        // Use the real Benchmark implementation if not already set
        if (!ctx.benchmark) {
            ctx.benchmark = new Benchmark();
        }
        this.container.registerInstance(BenchmarkAbstraction, ctx.benchmark);

        this.container.registerInstance(CoreGraphQLSchemaFactory, {
            execute: async builder => {
                builder.addTypeDefs("scalar RevisionId");
                builder.addLegacyResolvers({ RevisionId: RevisionIdScalar });
                return builder;
            }
        });

        ctx.plugins.register(
            new StorageOperationsCmsModelPlugin(
                createCmsModelFieldConvertersAttachFactory(ctx as CmsContext)
            )
        );

        const accessControl = new AccessControl({
            getIdentity: async () => this.identityContext.getIdentity(),
            getGroupsPermissions: () =>
                this.identityContext.getPermissions("cms.contentModelGroup"),
            getModelsPermissions: () => this.identityContext.getPermissions("cms.contentModel"),
            getEntriesPermissions: () => this.identityContext.getPermissions("cms.contentEntry"),
            listAllGroups: () => {
                return this.identityContext.withoutAuthorization(() => {
                    return ctx.cms.listGroups();
                });
            }
        });

        const storageOperationsFactory = this.container.resolve(StorageOperationsFactory);
        const storageOperations = await storageOperationsFactory.create(ctx);
        await storageOperations.beforeInit(ctx as CmsContext);

        const getTenant = () => this.tenantContext.getTenant();

        ctx.cms = {
            type,
            READ: type === "read",
            PREVIEW: type === "preview",
            MANAGE: type === "manage",
            storageOperations,
            accessControl,
            getExecutableSchema: async (schemaType: ApiEndpoint) => {
                // Use a forked context for schema generation so that:
                // 1. Type flags are correct for the requested schema type
                // 2. generateSchema's ctx.plugins.register() doesn't pollute the main context's plugin list
                const schemaCtx: Record<string, any> = Object.assign(
                    Object.create(Object.getPrototypeOf(ctx)),
                    ctx,
                    {
                        plugins: new PluginsContainer([...createFieldConverters()]),
                        cms: {
                            ...ctx.cms,
                            type: schemaType,
                            READ: schemaType === "read",
                            PREVIEW: schemaType === "preview",
                            MANAGE: schemaType === "manage"
                        }
                    }
                );
                const bm = this.container.resolve(BenchmarkAbstraction);
                const schema = await bm.measure("headlessCms.graphql.getSchema", async () => {
                    return this.identityContext.withoutAuthorization(() => {
                        return getSchema({
                            context: schemaCtx as CmsContext,
                            getTenant,
                            type: schemaType
                        });
                    });
                });

                // Execution uses the original ctx so CRUD methods and security have correct context
                return async (input: any) => {
                    const body = await bm.measure(
                        "headlessCms.graphql.createRequestBody",
                        async () => input
                    );
                    return bm.measure("headlessCms.graphql.processRequestBody", async () =>
                        processRequestBody(body, schema, ctx as CmsContext)
                    );
                };
            },
            ...createModelGroupsCrud({ context: ctx as CmsContext }),
            ...createModelsCrud({ context: ctx as CmsContext }),
            ...createContentEntryCrud({ context: ctx as CmsContext }),
            export: { ...createExportCrud(ctx as CmsContext) },
            importing: { ...createImportCrud(ctx as CmsContext) }
        };

        // Register CMS sub-schema factories: base types (CmsError, CmsIdentity, etc.)
        // and, for manage endpoints, the import/export operations.
        this.container.registerInstance(CmsGraphQLSchemaFactory, {
            execute: () => createBaseSchemaPlugins(ctx as CmsContext)
        });
        if (type === "manage") {
            this.container.registerInstance(CmsGraphQLSchemaFactory, {
                execute: () => [exportPlugin]
            });
        }

        // Register legacy DI abstractions for use-cases that resolve them
        this.container.registerInstance(StorageOperations, storageOperations);
        this.container.registerInstance(AccessControlAbstraction, accessControl);
        this.container.registerInstance(CmsContextAbstraction, ctx as CmsContext);
        this.container.registerInstance(PluginsContainerAbstraction, ctx.plugins);
        this.container.registerInstance(EntryToStorageTransform, (model, entry) => {
            return entryToStorageTransform(ctx as CmsContext, model, entry);
        });
        this.container.registerInstance(EntryFromStorageTransform, (model, entry) => {
            return entryFromStorageTransform(ctx as CmsContext, model, entry);
        });
        this.container.registerInstance(SearchableFieldsProvider, params => {
            return getSearchableFields({
                context: ctx as CmsContext,
                fields: params.fields,
                input: []
            });
        });

        if (storageOperations.init) {
            await storageOperations.init(ctx as CmsContext);
        }

        // Apply ContextPlugin instances from extraPlugins (they may register event handlers etc.)
        for (const plugin of this.config.extraPlugins ?? []) {
            if (plugin && typeof plugin.apply === "function") {
                await plugin.apply(ctx);
            }
        }
    }
}
