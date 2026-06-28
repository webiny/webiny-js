import type { Container } from "@webiny/di";
import { GraphQLContextInitializer, GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import type { IGraphQLContextInitializer } from "@webiny/handler-graphql";
import type { IGraphQLSchemaBuilder } from "@webiny/handler-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import type { IGraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin.js";
import { RequestContainer } from "@webiny/event-handler-core";
import { isHeadlessCmsReady } from "@webiny/api-headless-cms";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/abstractions.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { createGraphQLSchemaPluginFromFieldPlugins } from "@webiny/api-headless-cms/utils/getSchemaFromFieldPlugins.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { createFoldersSchema } from "~/folder/folder.gql.js";
import { FOLDER_MODEL_ID } from "~/domain/folder/folder.model.js";
import { FolderModel as FolderModelAbstraction } from "~/domain/folder/abstractions.js";
import { CmsFlpFeature } from "~/features/cms/index.js";
import type { AcoContext } from "~/types.js";

/**
 * Per-request setup that cannot be a synchronous DI factory.
 *
 * The ACO facade (filter/flp CRUD, AcoFilterCrud / AcoFlpCrud / FilterStorageOperations) is a LAZY
 * factory now — see AcoFeature.register. The only work that must stay eager, per request, before
 * resolvers is:
 *
 * 1. Resolving the per-tenant folder model (async) and exposing it as FolderModelAbstraction.
 * 2. Registering the WCP-gated CMS-entry FLP decorators (CmsFlpFeature) — they must be in place
 *    before any CMS-entry resolver runs, and the WCP license is only known post-RequestInitializer.
 * 3. Building the dynamic folder GraphQL schema (needs the resolved folder model).
 */
class AcoInitializerImpl implements IGraphQLContextInitializer {
    private initialized = false;

    constructor(private container: Container) {}

    async init(ctx: Record<string, any>): Promise<void> {
        if (!this.initialized) {
            this.initialized = true;
            await this._initialize(ctx);
        }
    }

    private async _initialize(ctx: Record<string, any>): Promise<void> {
        if (!(await isHeadlessCmsReady(ctx as AcoContext))) {
            return;
        }

        const identityContext = this.container.resolve(IdentityContext);

        // Expose the per-tenant folder model.
        await identityContext.withoutAuthorization(async () => {
            const folderModel = await this.container
                .resolve(GetModelUseCase)
                .execute(FOLDER_MODEL_ID);
            this.container.registerInstance(FolderModelAbstraction, folderModel.value);
        });

        // CMS-entry folder-level-permission decorators (WCP-gated). Must be registered before any
        // CMS-entry resolver runs, so this stays in the (pre-resolver) initializer rather than a
        // lazy factory.
        if (this.container.resolve(WcpContext).canUseFolderLevelPermissions()) {
            CmsFlpFeature.register(this.container);
        }

        // Dynamic folder schema: register each field/folder schema plugin as a CoreGraphQLSchemaFactory.
        const fieldRegistry = this.container.resolve(CmsModelFieldToGraphQLRegistry);
        await identityContext.withoutAuthorization(async () => {
            const modelResult = await this.container
                .resolve(GetModelUseCase)
                .execute(FOLDER_MODEL_ID);
            if (modelResult.isFail()) {
                throw modelResult.error;
            }
            const model = modelResult.value as CmsModel;

            const modelsResult = await this.container.resolve(ListModelsUseCase).execute();
            if (modelsResult.isFail()) {
                throw modelsResult.error;
            }
            const models = modelsResult.value;

            const fieldPlugins = createGraphQLSchemaPluginFromFieldPlugins({
                models,
                type: "manage",
                fieldRegistry,
                createPlugin: ({ schema, type, fieldType }) => {
                    const plugin = new GraphQLSchemaPlugin(schema);
                    plugin.name = `aco.graphql.folder.schema.${type}.field.${fieldType}`;
                    return plugin;
                }
            });

            const graphQlPlugin = createFoldersSchema({ model, models, fieldRegistry });

            for (const p of [...fieldPlugins, graphQlPlugin] as IGraphQLSchemaPlugin[]) {
                this.container.registerInstance(CoreGraphQLSchemaFactory, {
                    async execute(builder: IGraphQLSchemaBuilder): Promise<IGraphQLSchemaBuilder> {
                        if (p.schema.typeDefs) {
                            builder.addTypeDefs(p.schema.typeDefs);
                        }
                        if (p.schema.resolvers) {
                            builder.addLegacyResolvers(p.schema.resolvers as Record<string, any>);
                        }
                        if (p.schema.resolverDecorators) {
                            for (const [path, decorators] of Object.entries(
                                p.schema.resolverDecorators
                            )) {
                                for (const decorator of decorators as any[]) {
                                    builder.addResolverDecorator(path, decorator);
                                }
                            }
                        }
                        return builder;
                    }
                });
            }
        });
    }
}

export const AcoInitializer = GraphQLContextInitializer.createImplementation({
    implementation: AcoInitializerImpl,
    dependencies: [RequestContainer]
});
