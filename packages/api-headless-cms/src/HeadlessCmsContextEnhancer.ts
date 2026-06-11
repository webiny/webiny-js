import type { Container } from "@webiny/di";
import { Abstraction } from "@webiny/di";
import { PluginsContainer } from "@webiny/plugins";
import { GraphQLContextEnhancer } from "@webiny/handler-graphql";
import type { IGraphQLContextEnhancer } from "@webiny/handler-graphql";
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
import { createBaseSchema } from "~/graphql/schema/baseSchema.js";
import { createExportGraphQL } from "~/export/graphql/index.js";
import { createRevisionIdScalarPlugin } from "~/graphql/scalars/RevisionIdScalarPlugin.js";
import { CmsInstallerFeature } from "~/features/installer/feature.js";
import { ContentEntriesFeature } from "~/features/contentEntry/ContentEntriesFeature.js";
import { ContentModelFeature } from "~/features/contentModel/ContentModelFeature.js";
import { ContentModelGroupFeature } from "~/features/contentModelGroup/ContentModelGroupFeature.js";
import { ModelBuilderFeature } from "~/features/modelBuilder/index.js";
import { CmsWhereMapperFeature } from "~/features/whereMapper/feature.js";
import { CmsSortMapperFeature } from "~/features/sortMapper/feature.js";
import { CmsWebhooksFeature } from "~/features/webhooks/feature.js";
import { GraphQLFeature } from "~/features/graphql/index.js";
import { ValidationFeature } from "~/features/validation/index.js";
import { StorageFeature } from "~/features/storage/index.js";
import { CompressionFeature } from "@webiny/utils/features/compression/feature.js";
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
import { RequestContainer } from "@webiny/event-handler-core";

export interface IHeadlessCmsEnhancerConfig {
    type: ApiEndpoint;
    extraPlugins?: any[];
}

export const HeadlessCmsEnhancerConfig = new Abstraction<IHeadlessCmsEnhancerConfig>(
    "HeadlessCmsEnhancerConfig"
);

class HeadlessCmsContextEnhancerImpl implements IGraphQLContextEnhancer {
    private initialized = false;

    constructor(
        private container: Container,
        private config: IHeadlessCmsEnhancerConfig
    ) {}

    async enhance(ctx: Record<string, any>): Promise<void> {
        if (this.initialized) {
            return;
        }
        this.initialized = true;
        await this._enhance(ctx);
    }

    async _enhance(ctx: Record<string, any>): Promise<void> {
        const { type } = this.config;

        // Provide a PluginsContainer with field converters and required scalar plugins
        ctx.plugins = new PluginsContainer([
            ...createFieldConverters(),
            ...createRevisionIdScalarPlugin(),
            ...(this.config.extraPlugins ?? [])
        ]);

        // Passthrough benchmark stub — the real implementation lives in @webiny/api/Context
        if (!ctx.benchmark) {
            ctx.benchmark = {
                elapsed: 0,
                runs: {},
                measurements: [],
                output: async () => {},
                onOutput: () => {},
                enableOn: () => {},
                enable: () => {},
                disable: () => {},
                measure: async (_opts: any, fn: () => Promise<any>) => fn()
            };
        }

        // Must run before storage ops — registers graphql/validation/storage DI features
        CompressionFeature.register(this.container);
        GraphQLFeature.register(this.container);
        ValidationFeature.register(this.container);
        StorageFeature.register(this.container);

        ctx.plugins.register(
            new StorageOperationsCmsModelPlugin(
                createCmsModelFieldConvertersAttachFactory(ctx as CmsContext)
            )
        );

        const accessControl = new AccessControl({
            getIdentity: async () => ctx.security.getIdentity(),
            getGroupsPermissions: () => ctx.security.getPermissions("cms.contentModelGroup"),
            getModelsPermissions: () => ctx.security.getPermissions("cms.contentModel"),
            getEntriesPermissions: () => ctx.security.getPermissions("cms.contentEntry"),
            listAllGroups: () => {
                return ctx.security.withoutAuthorization(() => {
                    return ctx.cms.listGroups();
                });
            }
        });

        const storageOperationsFactory = this.container.resolve(StorageOperationsFactory);
        const storageOperations = await storageOperationsFactory.create(ctx);
        await storageOperations.beforeInit(ctx);

        const getTenant = () => ctx.tenancy.getCurrentTenant();

        ctx.cms = {
            type,
            READ: type === "read",
            PREVIEW: type === "preview",
            MANAGE: type === "manage",
            storageOperations,
            accessControl,
            getExecutableSchema: async (schemaType: ApiEndpoint) => {
                const schema = await ctx.security.withoutAuthorization(() => {
                    return getSchema({ context: ctx as CmsContext, getTenant, type: schemaType });
                });
                return async (input: any) => processRequestBody(input, schema, ctx as CmsContext);
            },
            ...createModelGroupsCrud({ context: ctx as CmsContext }),
            ...createModelsCrud({ context: ctx as CmsContext }),
            ...createContentEntryCrud({ context: ctx as CmsContext }),
            export: { ...createExportCrud(ctx as CmsContext) },
            importing: { ...createImportCrud(ctx as CmsContext) }
        };

        // Apply base and export schema context plugins —
        // these register CmsGraphQLSchemaPlugin instances into ctx.plugins.
        // createCmsSchema() is pre-registered in HeadlessCmsFeature (CoreGraphQLSchemaFactory).
        await createBaseSchema().apply(ctx as CmsContext);
        await createExportGraphQL().apply(ctx as CmsContext);

        // Register DI features after cms is set on ctx
        CmsInstallerFeature.register(this.container);
        ContentEntriesFeature.register(this.container);
        ContentModelFeature.register(this.container);
        ContentModelGroupFeature.register(this.container);
        ModelBuilderFeature.register(this.container);
        CmsWhereMapperFeature.register(this.container);
        CmsSortMapperFeature.register(this.container);
        CmsWebhooksFeature.register(this.container);

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
            await storageOperations.init(ctx);
        }

        // Apply ContextPlugin instances from extraPlugins (they may register event handlers etc.)
        for (const plugin of this.config.extraPlugins ?? []) {
            if (plugin && typeof plugin.apply === "function") {
                await plugin.apply(ctx);
            }
        }
    }
}

export const HeadlessCmsContextEnhancer = GraphQLContextEnhancer.createImplementation({
    implementation: HeadlessCmsContextEnhancerImpl,
    dependencies: [RequestContainer, HeadlessCmsEnhancerConfig]
});
