import type { Context } from "~/types.js";
import { GraphQLSchemaPlugin, resolve, resolveList } from "@webiny/handler-graphql";
import { createZodError } from "@webiny/utils";
import { listWorkflowStatesValidation } from "~/validation/listWorkflowStates.js";
import { approveWorkflowStateValidation } from "~/validation/approveWorkflowState.js";
import { rejectWorkflowStateValidation } from "~/validation/rejectWorkflowState.js";
import { cancelWorkflowStateValidation } from "~/validation/cancelWorkflowState.js";
import { createWorkflowStateValidation } from "~/validation/createWorkflowState.js";
import { getTargetWorkflowStateValidation } from "~/validation/getTargetWorkflowState.js";
import { getWorkflowStateValidation } from "~/validation/getWorkflowState.js";
import { startWorkflowStateValidation } from "~/validation/startWorkflowState.js";
import type { IWorkflowState } from "~/context/abstractions/WorkflowState.js";

export const createWorkflowStateSchema = () => {
    return new GraphQLSchemaPlugin<Context>({
        typeDefs: /* GraphQL */ `
            enum WorkflowStateStateValue {
                pending
                inReview
                approved
                rejected
            }

            type WorkflowStateIdentity {
                id: String!
                displayName: String
                type: String
            }

            type WorkflowStateStepNotification {
                id: String!
            }

            type WorkflowStateStepTeam {
                id: String!
            }

            type WorkflowStateStep {
                # workflow related
                id: String!
                title: String!
                color: String!
                description: String
                teams: [WorkflowStateStepTeam!]!
                notifications: [WorkflowStateStepNotification!]
                # state related
                state: WorkflowStateStateValue!
                comment: String
                savedBy: WorkflowStateIdentity
                # current user can take action on this step?
                isAllowedToReview: Boolean!
            }

            type WorkflowState {
                id: String!
                app: String!
                isActive: Boolean!
                workflowId: String!
                targetId: String!
                targetRevisionId: String!
                comment: String
                state: WorkflowStateStateValue!
                steps: [WorkflowStateStep!]
                createdOn: DateTime!
                savedOn: DateTime!
                createdBy: WorkflowStateIdentity!
                savedBy: WorkflowStateIdentity!
            }

            type ListWorkflowStatesResponse {
                data: [WorkflowState!]
                error: WorkflowError
                meta: ListWorkflowsMeta
            }

            enum ListWorkflowStatesSort {
                createdOn_ASC
                createdOn_DESC
                savedOn_ASC
                savedOn_DESC
            }

            input ListWorkflowStatesWhereInput {
                app: String
                app_in: [String!]
                workflowId: String
                workflowId_in: [String!]
                targetId: String
                targetId_in: [String!]
                targetRevisionId: String
                targetRevisionId_in: [String!]
                state: WorkflowStateStateValue
                state_in: [WorkflowStateStateValue!]
                createdOn_gte: DateTime
                createdOn_lte: DateTime
                savedOn_gte: DateTime
                savedOn_lte: DateTime
                createdBy: String
                savedBy: String
                isActive: Boolean
            }

            type WorkflowStateResponse {
                data: WorkflowState
                error: WorkflowError
            }

            type CancelWorkflowStateResponse {
                data: Boolean
                error: WorkflowError
            }

            extend type WorkflowsQuery {
                getWorkflowState(id: ID!): WorkflowStateResponse!
                # always returns active workflow state for the given targetRevisionId - or null
                getTargetWorkflowState(app: String!, targetRevisionId: ID!): WorkflowStateResponse!
                listWorkflowStates(
                    where: ListWorkflowStatesWhereInput
                    sort: [ListWorkflowStatesSort!]
                    limit: Number
                    after: String
                ): ListWorkflowStatesResponse!
            }

            extend type WorkflowsMutation {
                createWorkflowState(app: String!, targetRevisionId: ID!): WorkflowStateResponse!
                startWorkflowStateStep(id: ID!): WorkflowStateResponse!
                approveWorkflowStateStep(id: ID!, comment: String): WorkflowStateResponse!
                rejectWorkflowStateStep(id: ID!, comment: String!): WorkflowStateResponse!
                cancelWorkflowState(id: ID!): CancelWorkflowStateResponse!
            }
        `,
        resolvers: {
            WorkflowsQuery: {
                getWorkflowState: async (_, args, context) => {
                    return resolve<IWorkflowState>(async () => {
                        const result = await getWorkflowStateValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        return await context.workflowState.getState(result.data.id);
                    });
                },
                getTargetWorkflowState: async (_, args, context) => {
                    return resolve<IWorkflowState>(async () => {
                        const result = await getTargetWorkflowStateValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }
                        return await context.workflowState.getTargetState(
                            result.data.app,
                            result.data.targetRevisionId
                        );
                    });
                },
                listWorkflowStates: async (_, args, context) => {
                    return resolveList<IWorkflowState>(async () => {
                        const result = await listWorkflowStatesValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }
                        return await context.workflowState.listStates(result.data);
                    });
                }
            },
            WorkflowsMutation: {
                createWorkflowState: async (_, args, context) => {
                    return resolve<IWorkflowState>(async () => {
                        const result = await createWorkflowStateValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        return await context.workflowState.createState(
                            result.data.app,
                            result.data.targetRevisionId
                        );
                    });
                },
                startWorkflowStateStep: async (_, args, context) => {
                    return resolve<IWorkflowState>(async () => {
                        const result = await startWorkflowStateValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }
                        return await context.workflowState.startStateStep(result.data.id);
                    });
                },
                approveWorkflowStateStep: (_, args, context) => {
                    return resolve<IWorkflowState>(async () => {
                        const result = await approveWorkflowStateValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }
                        return await context.workflowState.approveStateStep(
                            result.data.id,
                            result.data.comment
                        );
                    });
                },
                rejectWorkflowStateStep: (_, args, context) => {
                    return resolve<IWorkflowState>(async () => {
                        const result = await rejectWorkflowStateValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }
                        return await context.workflowState.rejectStateStep(
                            result.data.id,
                            result.data.comment
                        );
                    });
                },
                cancelWorkflowState: (_, args, context) => {
                    return resolve<boolean>(async () => {
                        const result = await cancelWorkflowStateValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }
                        await context.workflowState.cancelState(result.data.id);
                        return true;
                    });
                }
            }
        }
    });
};
