import type { Context } from "~/types.js";
import { GraphQLSchemaPlugin, resolve, resolveList } from "@webiny/handler-graphql";
import { createZodError } from "@webiny/utils";
import { listWorkflowStatesValidation } from "~/validation/listWorkflowStates.js";
import { getWorkflowTargetStateValidation } from "~/validation/getWorkflowTargetState.js";
import { approveWorkflowStateValidation } from "~/validation/approveWorkflowState.js";
import { rejectWorkflowStateValidation } from "~/validation/rejectWorkflowState.js";
import { cancelWorkflowStateValidation } from "~/validation/cancelWorkflowState.js";
import { createWorkflowStateValidation } from "~/validation/createWorkflowState.js";

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

            type WorkflowStateStep {
                id: String!
                state: WorkflowStateStateValue!
                comment: String
                savedBy: WorkflowStateIdentity
            }

            type WorkflowState {
                id: String!
                name: String!
                createdOn: DateTime!
                savedOn: DateTime!
                savedBy: WorkflowStateIdentity!
                app: String!
                workflowId: String!
                targetId: String!
                targetRevisionId: String!
                comment: String
                state: WorkflowStateStateValue!
                steps: [WorkflowStateStep!]
            }

            type ListWorkflowStatesResponse {
                data: [WorkflowState!]
                error: WorkflowError
                meta: ListWorkflowsMeta
            }

            enum ListWorkflowStatesSort {
                createdOn_ASC
                createdOn_DESC
            }

            input ListWorkflowStatesWhereInput {
                app: String
                app_in: [String!]
                workflowId: String
                workflowId_id: [String!]
                targetId: String
                targetId_in: [String!]
                targetRevisionId: String
                targetRevisionId_in: [String!]
                state: WorkflowStateStateValue
                savedBy: String
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
                getWorkflowTargetState(app: String!, id: ID!): WorkflowStateResponse!
                listWorkflowStates(
                    where: ListWorkflowStatesWhereInput
                    sort: [ListWorkflowStatesSort!]
                    limit: Number
                    after: String
                ): ListWorkflowStatesResponse!
            }

            extend type WorkflowsMutation {
                createWorkflowState(app: String!, targetRevisionId: ID!): WorkflowStateResponse!
                approveWorkflowStateStep(
                    id: ID!
                    stepId: ID!
                    comment: String!
                ): WorkflowStateResponse!
                rejectWorkflowStateStep(
                    id: ID!
                    stepId: ID!
                    comment: String!
                ): WorkflowStateResponse!
                cancelWorkflowState(id: ID!, comment: String!): CancelWorkflowStateResponse!
            }
        `,
        resolvers: {
            WorkflowsQuery: {
                getWorkflowTargetState: async (_, args, context) => {
                    return resolve(async () => {
                        const result = await getWorkflowTargetStateValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }
                        return await context.workflowState.getTargetState(
                            result.data.app,
                            result.data.id
                        );
                    });
                },
                listWorkflowStates: async (_, args, context) => {
                    return resolveList(async () => {
                        const result = await listWorkflowStatesValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }
                        const { items, meta } = await context.workflowState.listStates(result.data);

                        return {
                            meta,
                            items: items.map(state => {
                                return state.record;
                            })
                        };
                    });
                }
            },
            WorkflowsMutation: {
                createWorkflowState: async (_, args, context) => {
                    return resolve(async () => {
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
                approveWorkflowStateStep: (_, args, context) => {
                    return resolve(async () => {
                        const result = await approveWorkflowStateValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }
                        return await context.workflowState.approveStateStep(
                            result.data.id,
                            result.data.stepId,
                            result.data.comment
                        );
                    });
                },
                rejectWorkflowStateStep: (_, args, context) => {
                    return resolve(async () => {
                        const result = await rejectWorkflowStateValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }
                        return await context.workflowState.rejectStateStep(
                            result.data.id,
                            result.data.stepId,
                            result.data.comment
                        );
                    });
                },
                cancelWorkflowState: (_, args, context) => {
                    return resolve(async () => {
                        const result = await cancelWorkflowStateValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }
                        await context.workflowState.deleteState(result.data.id);
                        return true;
                    });
                }
            }
        }
    });
};
