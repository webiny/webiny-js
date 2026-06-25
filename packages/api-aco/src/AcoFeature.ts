import { createFeature } from "@webiny/feature/api";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { GraphQLContextualSchema } from "@webiny/handler-graphql";
import {
    GraphQLSchemaFactory,
    CoreGraphQLSchemaFactory
} from "@webiny/handler-graphql/graphql/abstractions.js";
import type { IGraphQLContextualSchema } from "@webiny/handler-graphql";
import type { IGraphQLSchemaBuilder } from "@webiny/handler-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import type { IGraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin.js";
import type { GraphQLSchema } from "graphql";
import type { Container } from "@webiny/di";
import { RequestContainer } from "@webiny/event-handler-core";
import { isHeadlessCmsReady } from "@webiny/api-headless-cms";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { createGraphQLSchemaPluginFromFieldPlugins } from "@webiny/api-headless-cms/utils/getSchemaFromFieldPlugins.js";
import { createFoldersSchema } from "~/folder/folder.gql.js";
import { FOLDER_MODEL_ID } from "~/domain/folder/folder.model.js";
import { createAcoContext } from "./createAcoContext.js";
import { createAcoGraphQL } from "./createAcoGraphQL.js";
import { CreateFlpTask } from "~/flp/tasks/createFlp.task.js";
import { UpdateFlpTask } from "~/flp/tasks/updateFlp.task.js";
import { DeleteFlpTask } from "~/flp/tasks/deleteFlp.task.js";
import { SyncFlpTask } from "~/flp/tasks/syncFlp.task.js";
import type { AcoContext } from "~/types.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { FolderModel } from "~/domain/folder/folder.model.js";
import { FilterPrivateModel } from "~/filter/filter.model.js";

class AcoInitializerImpl implements IGraphQLContextualSchema {
    private initialized = false;

    constructor(private container: Container) {}

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
        if (!(await isHeadlessCmsReady(ctx as AcoContext))) {
            return;
        }

        // Register background task definitions into the container
        this.container.register(CreateFlpTask);
        this.container.register(UpdateFlpTask);
        this.container.register(DeleteFlpTask);
        this.container.register(SyncFlpTask);

        // createAcoContext() returns [acoContextPlugin, modelsPlugin].
        // modelsPlugin registers FolderModel and FilterPrivateModel, so it must run first.
        const [acoContextPlugin, modelsPlugin] = createAcoContext();

        if (modelsPlugin && typeof modelsPlugin.apply === "function") {
            await modelsPlugin.apply(ctx as AcoContext);
        }

        if (acoContextPlugin && typeof acoContextPlugin.apply === "function") {
            await acoContextPlugin.apply(ctx as AcoContext);
        }

        // Inline the folderSchema ContextPlugin logic (was: folderSchema.apply(ctx) which
        // called context.plugins.register([...fieldPlugins, graphQlPlugin])). Register each
        // plugin as a CoreGraphQLSchemaFactory instead.
        const fieldRegistry = this.container.resolve(CmsModelFieldToGraphQLRegistry);
        await this.container.resolve(IdentityContext).withoutAuthorization(async () => {
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

const AcoInitializer = GraphQLContextualSchema.createImplementation({
    implementation: AcoInitializerImpl,
    dependencies: [RequestContainer]
});

class AcoSchemaFactoryImpl implements GraphQLSchemaFactory.Interface {
    async execute(builder: IGraphQLSchemaBuilder): Promise<IGraphQLSchemaBuilder> {
        // createAcoGraphQL() returns [baseSchema, folderSchema, filterSchema].
        // baseSchema and filterSchema are static GraphQLSchemaPlugins — register them here.
        // folderSchema is a ContextPlugin that needs ctx.cms; it is applied by AcoInitializer.
        const [baseSchema, , filterSchema] =
            createAcoGraphQL() as unknown as IGraphQLSchemaPlugin[];

        for (const plugin of [baseSchema, filterSchema]) {
            const schema = (plugin as IGraphQLSchemaPlugin).schema;

            if (schema.typeDefs) {
                builder.addTypeDefs(schema.typeDefs);
            }

            if (schema.resolvers) {
                builder.addLegacyResolvers(schema.resolvers as Record<string, any>);
            }
        }

        return builder;
    }
}

const AcoSchemaFactory = GraphQLSchemaFactory.createImplementation({
    implementation: AcoSchemaFactoryImpl,
    dependencies: []
});

export const AcoFeature = createFeature({
    name: "Aco",
    register(container: Container) {
        container.register(FolderModel);
        container.register(FilterPrivateModel);
        container.register(AcoInitializer);
        container.register(AcoSchemaFactory);
    }
});
