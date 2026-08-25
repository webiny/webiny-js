import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import type {
    IGraphQLSchemaFactory,
    GraphQLSchemaFactory as GQLSchemaFactory
} from "@webiny/api-graphql/graphql/abstractions.js";
import { addNotificationsSchema } from "~/graphql/notifications.js";
import { addWorkflowsSchema } from "~/graphql/workflows.js";
import { addWorkflowStateSchema } from "~/graphql/workflowState.js";

class WorkflowsSchemaFactoryImpl implements IGraphQLSchemaFactory {
    async execute(
        builder: GQLSchemaFactory.SchemaBuilder
    ): Promise<GQLSchemaFactory.SchemaBuilder> {
        addWorkflowsSchema(builder);
        addWorkflowStateSchema(builder);
        addNotificationsSchema(builder);

        return builder;
    }
}

export const WorkflowsSchemaFactory = GraphQLSchemaFactory.createImplementation({
    implementation: WorkflowsSchemaFactoryImpl,
    dependencies: []
});
