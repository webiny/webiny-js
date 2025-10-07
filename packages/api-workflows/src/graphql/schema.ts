import type { Context } from "~/types.js";
import { GraphQLSchemaPlugin, NotFoundError, resolve, resolveList } from "@webiny/handler-graphql";
import { listWorkflowsValidation } from "~/validation/listWorkflows.js";
import { createZodError } from "@webiny/utils";
import { getWorkflowValidation } from "~/validation/getWorkflow.js";
import { storeWorkflowValidation } from "~/validation/storeWorkflow.js";
import { deleteWorkflowValidation } from "~/validation/deleteWorkflow.js";

export const createSchema = () => {
    return new GraphQLSchemaPlugin<Context>({
        typeDefs: /* GraphQL */ `
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

            type ListWorkflowsResponse {
                data: [Workflow!]
                error: WorkflowError
            }

            type GetWorkflowResponse {
                data: Workflow
                error: WorkflowError
            }

            type WorkflowsQuery {
                listWorkflows(app: String): ListWorkflowsResponse!
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
        `,
        resolvers: {
            Query: {
                workflows: () => ({})
            },
            Mutation: {
                workflows: () => ({})
            },
            WorkflowsQuery: {
                getWorkflow: async (_, args, context) => {
                    return resolve(async () => {
                        const result = await getWorkflowValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        const workflow = await context.workflows.getWorkflow(args);
                        if (workflow) {
                            return workflow;
                        }
                        throw new NotFoundError(
                            `Workflow in app "${args.app}" with id "${args.id}" was not found!`
                        );
                    });
                },
                listWorkflows: async (_, args, context) => {
                    return resolveList(async () => {
                        const result = await listWorkflowsValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }
                        const items = await context.workflows.listWorkflows(result.data);

                        return {
                            items,
                            meta: {
                                totalCount: items.length,
                                hasMoreItems: false,
                                cursor: null
                            }
                        };
                    });
                }
            },
            WorkflowsMutation: {
                storeWorkflow: async (_, args, context) => {
                    return resolve(async () => {
                        const result = await storeWorkflowValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }
                        return context.workflows.storeWorkflow(
                            result.data.app,
                            result.data.id,
                            result.data.data
                        );
                    });
                },
                deleteWorkflow: async (_, args, context) => {
                    return resolve(async () => {
                        const result = await deleteWorkflowValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }
                        return await context.workflows.deleteWorkflow(
                            result.data.app,
                            result.data.id
                        );
                    });
                }
            }
        }
    });
};
