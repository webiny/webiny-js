import { GraphQLSchemaPlugin } from "@webiny/api-graphql";
import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import type { IGraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import type { IGraphQLSchemaPlugin } from "@webiny/api-graphql/plugins/GraphQLSchemaPlugin.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import { createGraphQLSchemaPluginFromFieldPlugins } from "@webiny/api-headless-cms/utils/getSchemaFromFieldPlugins.js";
import { FolderModelProvider } from "~/domain/folder/abstractions.js";
import { createFoldersSchema } from "~/folder/folder.gql.js";

/**
 * Builds the dynamic folder GraphQL schema — the `Folder` type's fields are rendered from the
 * tenant's folder model, so the shape differs per tenant.
 *
 * Previously done by `AcoInitializer`, which had to run as a per-request hook before any resolver:
 * it fetched the model, then registered one `CoreGraphQLSchemaFactory` per generated plugin. That
 * indirection is unnecessary — `CoreGraphQLSchemaFactory.execute()` is already awaited by
 * `GraphQLSchemaComposer`, so this factory can be registered once at compose time and do its async
 * work inside `execute()`, at the moment the schema is actually built.
 */
class AcoFolderSchemaFactoryImpl implements CoreGraphQLSchemaFactory.Interface {
    constructor(
        private folderModelProvider: FolderModelProvider.Interface,
        private listModels: ListModelsUseCase.Interface,
        private fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface,
        private identityContext: IdentityContext.Interface,
        private tenantContext: TenantContext.Interface
    ) {}

    async execute(builder: IGraphQLSchemaBuilder): Promise<IGraphQLSchemaBuilder> {
        // On a fresh project there is no tenant until installation completes, and there is no model
        // to render a schema from. (This is what `isHeadlessCmsReady` checked in the initializer.)
        if (!this.tenantContext.getTenant()) {
            return builder;
        }

        const model = await this.folderModelProvider.get();

        // The model list feeds `ref` field rendering, so it must be the COMPLETE set — access
        // control filters models by permission, which would otherwise make the generated schema
        // vary by identity. Hence the unauthorized read, exactly as the initializer did.
        const models = await this.identityContext.withoutAuthorization(async () => {
            const result = await this.listModels.execute();
            if (result.isFail()) {
                throw result.error;
            }
            return result.value;
        });

        const fieldPlugins = createGraphQLSchemaPluginFromFieldPlugins({
            models,
            type: "manage",
            fieldRegistry: this.fieldRegistry,
            createPlugin: ({ schema, type, fieldType }) => {
                const plugin = new GraphQLSchemaPlugin(schema);
                plugin.name = `aco.graphql.folder.schema.${type}.field.${fieldType}`;
                return plugin;
            }
        });

        const folderPlugin = createFoldersSchema({
            model,
            models,
            fieldRegistry: this.fieldRegistry
        });

        for (const plugin of [...fieldPlugins, folderPlugin] as IGraphQLSchemaPlugin[]) {
            if (plugin.schema.typeDefs) {
                builder.addTypeDefs(plugin.schema.typeDefs);
            }
            if (plugin.schema.resolvers) {
                builder.addLegacyResolvers(plugin.schema.resolvers as Record<string, any>);
            }
            if (plugin.schema.resolverDecorators) {
                for (const [path, decorators] of Object.entries(plugin.schema.resolverDecorators)) {
                    for (const decorator of decorators as any[]) {
                        builder.addResolverDecorator(path, decorator);
                    }
                }
            }
        }

        return builder;
    }
}

export const AcoFolderSchemaFactory = CoreGraphQLSchemaFactory.createImplementation({
    implementation: AcoFolderSchemaFactoryImpl,
    dependencies: [
        FolderModelProvider,
        ListModelsUseCase,
        CmsModelFieldToGraphQLRegistry,
        IdentityContext,
        TenantContext
    ]
});
