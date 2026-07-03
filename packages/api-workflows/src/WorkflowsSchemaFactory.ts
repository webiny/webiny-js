import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import type {
    IGraphQLSchemaFactory,
    GraphQLSchemaFactory as GQLSchemaFactory
} from "@webiny/handler-graphql/graphql/abstractions.js";
import { createNotificationsGraphQL } from "~/graphql/notifications.js";
import { createWorkflowsSchema } from "~/graphql/workflows.js";
import { createWorkflowStateSchema } from "~/graphql/workflowState.js";
import type { IGraphQLSchemaBuilder } from "@webiny/handler-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import type { IGraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin.js";

function addPluginsToBuilder(
    plugins: IGraphQLSchemaPlugin[],
    builder: IGraphQLSchemaBuilder
): void {
    for (const plugin of plugins) {
        const schema = plugin.schema;

        if (schema.typeDefs) {
            builder.addTypeDefs(schema.typeDefs);
        }

        if (schema.resolvers) {
            addResolvers(builder, schema.resolvers as Record<string, any>, "");
        }

        if (schema.resolverDecorators) {
            for (const [path, decorators] of Object.entries(schema.resolverDecorators)) {
                for (const decorator of decorators as any[]) {
                    builder.addResolverDecorator(path, decorator);
                }
            }
        }
    }
}

function addResolvers(
    builder: IGraphQLSchemaBuilder,
    resolvers: Record<string, any>,
    prefix: string
): void {
    for (const [key, value] of Object.entries(resolvers)) {
        const path = prefix ? `${prefix}.${key}` : key;

        if (typeof value === "function") {
            const oldResolver = value;
            builder.addResolver({
                path,
                dependencies: [],
                resolver:
                    () =>
                    ({ parent, args, context, info }: any) =>
                        oldResolver(parent, args, context, info)
            });
        } else if (typeof value === "object" && value !== null) {
            addResolvers(builder, value, path);
        }
    }
}

class WorkflowsSchemaFactoryImpl implements IGraphQLSchemaFactory {
    async execute(
        builder: GQLSchemaFactory.SchemaBuilder
    ): Promise<GQLSchemaFactory.SchemaBuilder> {
        const plugins = [
            createNotificationsGraphQL(),
            createWorkflowsSchema(),
            createWorkflowStateSchema()
        ] as unknown as IGraphQLSchemaPlugin[];

        addPluginsToBuilder(plugins, builder);

        return builder;
    }
}

export const WorkflowsSchemaFactory = GraphQLSchemaFactory.createImplementation({
    implementation: WorkflowsSchemaFactoryImpl,
    dependencies: []
});
