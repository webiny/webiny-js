import { createFeature } from "@webiny/feature/api";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { GraphQLContextualSchema } from "@webiny/handler-graphql";
import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import type { IGraphQLContextualSchema } from "@webiny/handler-graphql";
import type { IGraphQLSchemaBuilder } from "@webiny/handler-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import type { IGraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin.js";
import type { GraphQLSchema } from "graphql";
import type { Container } from "@webiny/di";
import { RequestContainer } from "@webiny/event-handler-core";
import { isHeadlessCmsReady } from "@webiny/api-headless-cms";
import { createAcoContext } from "./createAcoContext.js";
import { createAcoGraphQL } from "./createAcoGraphQL.js";
import { CreateFlpTask } from "~/flp/tasks/createFlp.task.js";
import { UpdateFlpTask } from "~/flp/tasks/updateFlp.task.js";
import { DeleteFlpTask } from "~/flp/tasks/deleteFlp.task.js";
import { SyncFlpTask } from "~/flp/tasks/syncFlp.task.js";
import type { AcoContext } from "~/types.js";
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

        // Apply the dynamic folderSchema ContextPlugin so it registers the folder GraphQL schema
        // into ctx.plugins (it depends on ctx.cms being populated by the step above).
        const [, folderSchema] = createAcoGraphQL();
        if (folderSchema && typeof (folderSchema as any).apply === "function") {
            await (folderSchema as any).apply(ctx as AcoContext);
        }
    }
}

const AcoInitializer = GraphQLContextualSchema.createImplementation({
    implementation: AcoInitializerImpl,
    dependencies: [RequestContainer]
});

function addResolvers(
    builder: IGraphQLSchemaBuilder,
    resolvers: Record<string, any>,
    prefix: string
): void {
    for (const [key, value] of Object.entries(resolvers)) {
        const path = prefix ? `${prefix}.${key}` : key;

        if (typeof value === "function") {
            const fn = value;
            builder.addResolver({
                path,
                dependencies: [],
                resolver:
                    () =>
                    ({ parent, args, context, info }: any) =>
                        fn(parent, args, context, info)
            });
        } else if (typeof value === "object" && value !== null) {
            addResolvers(builder, value, path);
        }
    }
}

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
                addResolvers(builder, schema.resolvers as Record<string, any>, "");
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
