import { NotFoundError, resolve, resolveList } from "@webiny/api-graphql";
import type { IGraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { createZodError } from "@webiny/utils";
import { listWorkflowsValidation } from "./validation/listWorkflows.js";
import { getWorkflowValidation } from "./validation/getWorkflow.js";
import { storeWorkflowValidation } from "./validation/storeWorkflow.js";
import { deleteWorkflowValidation } from "./validation/deleteWorkflow.js";
import { GetWorkflowUseCase } from "~/features/workflow/GetWorkflow/index.js";
import { ListWorkflowsUseCase } from "~/features/workflow/ListWorkflows/index.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { DeleteWorkflowUseCase } from "~/features/workflow/DeleteWorkflow/index.js";

export const addWorkflowsSchema = (builder: IGraphQLSchemaBuilder): void => {
    builder.addTypeDefs(/* GraphQL */ `
        type WorkflowError {
            code: String
            message: String
            data: JSON
            stack: String
        }

        input WorkflowStepNotificationInput {
            id: String!
        }

        input WorkflowStepTeamInput {
            id: String!
        }

        input WorkflowStepInput {
            id: String!
            title: String!
            color: String!
            description: String
            teams: [WorkflowStepTeamInput!]!
            notifications: [WorkflowStepNotificationInput!]
        }

        input StoreWorkflowInput {
            name: String!
            steps: [WorkflowStepInput!]!
        }

        type WorkflowStepNotification {
            id: String!
        }

        type WorkflowStepTeam {
            id: String!
        }

        type WorkflowStep {
            id: String!
            title: String!
            color: String!
            description: String
            teams: [WorkflowStepTeam!]!
            notifications: [WorkflowStepNotification!]
        }

        type Workflow {
            id: String!
            app: String!
            name: String!
            steps: [WorkflowStep!]!
        }

        type ListWorkflowsMeta {
            cursor: String
            hasMoreItems: Boolean!
            totalCount: Int!
        }

        type ListWorkflowsResponse {
            data: [Workflow!]
            meta: ListWorkflowsMeta
            error: WorkflowError
        }

        type GetWorkflowResponse {
            data: Workflow
            error: WorkflowError
        }

        input ListWorkflowsWhereInput {
            app: String
            app_in: [String!]
            id: String
            id_in: [String!]
        }

        enum ListWorkflowsSort {
            createdOn_ASC
            createdOn_DESC
        }

        type WorkflowsQuery {
            listWorkflows(
                where: ListWorkflowsWhereInput
                limit: Int
                sort: [ListWorkflowsSort!]
                after: String
            ): ListWorkflowsResponse!
            getWorkflow(app: String!, id: ID!): GetWorkflowResponse!
        }

        type CreateWorkflowResponse {
            data: Workflow
            error: WorkflowError
        }

        type StoreWorkflowResponse {
            data: Workflow
            error: WorkflowError
        }

        type DeleteWorkflowResponse {
            data: Boolean
            error: WorkflowError
        }

        type WorkflowsMutation {
            storeWorkflow(
                app: String!
                id: ID!
                data: StoreWorkflowInput!
            ): StoreWorkflowResponse!
            deleteWorkflow(app: String!, id: ID!): DeleteWorkflowResponse!
        }

        extend type Query {
            workflows: WorkflowsQuery
        }

        extend type Mutation {
            workflows: WorkflowsMutation
        }
    `);

    builder.addResolver({
        path: "Query.workflows",
        dependencies: [],
        resolver: () => () => ({})
    });

    builder.addResolver({
        path: "Mutation.workflows",
        dependencies: [],
        resolver: () => () => ({})
    });

    builder.addResolver({
        path: "WorkflowsQuery.getWorkflow",
        dependencies: [GetWorkflowUseCase],
        resolver(getWorkflow) {
            return ({ args }) =>
                resolve(async () => {
                    const result = await getWorkflowValidation.safeParseAsync(args);
                    if (!result.success) {
                        throw createZodError(result.error);
                    }

                    const workflowResult = await getWorkflow.execute(args);

                    if (workflowResult.isFail()) {
                        throw new NotFoundError(
                            `Workflow in app "${args.app}" with id "${args.id}" was not found!`
                        );
                    }

                    return workflowResult.value;
                });
        }
    });

    builder.addResolver({
        path: "WorkflowsQuery.listWorkflows",
        dependencies: [ListWorkflowsUseCase],
        resolver(listWorkflows) {
            return ({ args }) =>
                resolveList(async () => {
                    const result = await listWorkflowsValidation.safeParseAsync(args);
                    if (!result.success) {
                        throw createZodError(result.error);
                    }

                    const listResult = await listWorkflows.execute(result.data);

                    if (listResult.isFail()) {
                        throw listResult.error;
                    }

                    return listResult.value;
                });
        }
    });

    builder.addResolver({
        path: "WorkflowsMutation.storeWorkflow",
        dependencies: [StoreWorkflowUseCase],
        resolver(storeWorkflow) {
            return ({ args }) =>
                resolve(async () => {
                    const result = await storeWorkflowValidation.safeParseAsync(args);
                    if (!result.success) {
                        throw createZodError(result.error);
                    }

                    const storeResult = await storeWorkflow.execute({
                        app: result.data.app,
                        id: result.data.id,
                        ...result.data.data
                    });

                    if (storeResult.isFail()) {
                        throw storeResult.error;
                    }

                    return storeResult.value;
                });
        }
    });

    builder.addResolver({
        path: "WorkflowsMutation.deleteWorkflow",
        dependencies: [DeleteWorkflowUseCase],
        resolver(deleteWorkflow) {
            return ({ args }) =>
                resolve(async () => {
                    const result = await deleteWorkflowValidation.safeParseAsync(args);
                    if (!result.success) {
                        throw createZodError(result.error);
                    }

                    const deleteResult = await deleteWorkflow.execute({
                        app: result.data.app,
                        id: result.data.id
                    });

                    if (deleteResult.isFail()) {
                        throw deleteResult.error;
                    }

                    return true;
                });
        }
    });
};
