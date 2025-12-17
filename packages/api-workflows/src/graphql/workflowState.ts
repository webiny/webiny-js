import type { Context } from "~/types.js";
import { GraphQLSchemaPlugin, resolve, resolveList } from "@webiny/handler-graphql";
import { createZodError } from "@webiny/utils";
import { listWorkflowStatesValidation } from "~/validation/listWorkflowStates.js";
import { startWorkflowStateValidation } from "~/validation/startWorkflowState.js";
import { approveWorkflowStateValidation } from "~/validation/approveWorkflowState.js";
import { rejectWorkflowStateValidation } from "~/validation/rejectWorkflowState.js";
import { cancelWorkflowStateValidation } from "~/validation/cancelWorkflowState.js";
import { createWorkflowStateValidation } from "~/validation/createWorkflowState.js";
import { getTargetWorkflowStateValidation } from "~/validation/getTargetWorkflowState.js";
import { getWorkflowStateValidation } from "~/validation/getWorkflowState.js";
import type { IWorkflowStateModel } from "~/context/abstractions/WorkflowState.js";
import { takeOverWorkflowStateStepValidation } from "~/validation/takeOverWorkflowStateStep.js";
import { GetWorkflowStateUseCase } from "~/features/workflowState/GetWorkflowState/index.js";
import { GetTargetWorkflowStateUseCase } from "~/features/workflowState/GetTargetWorkflowState/index.js";
import { ListWorkflowStatesUseCase } from "~/features/workflowState/ListWorkflowStates/index.js";
import { ListOwnWorkflowStatesUseCase } from "~/features/workflowState/ListOwnWorkflowStates/index.js";
import { ListRequestedWorkflowStatesUseCase } from "~/features/workflowState/ListRequestedWorkflowStates/index.js";
import { CreateWorkflowStateUseCase } from "~/features/workflowState/CreateWorkflowState/index.js";
import { StartWorkflowStateStepUseCase } from "~/features/workflowState/StartWorkflowStateStep/index.js";
import { ApproveWorkflowStateStepUseCase } from "~/features/workflowState/ApproveWorkflowStateStep/index.js";
import { RejectWorkflowStateStepUseCase } from "~/features/workflowState/RejectWorkflowStateStep/index.js";
import { CancelWorkflowStateUseCase } from "~/features/workflowState/CancelWorkflowState/index.js";
import { TakeOverWorkflowStateStepUseCase } from "~/features/workflowState/TakeOverWorkflowStateStep/index.js";

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
                canReview: Boolean!
                # is current user an owner of the step?
                isOwner: Boolean!
                # can current user take over this step?
                canTakeOver: Boolean!
            }

            type WorkflowState {
                id: String!
                app: String!
                title: String!
                isActive: Boolean!
                done: Boolean!
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
                currentStep: WorkflowStateStep!
                nextStep: WorkflowStateStep
                previousStep: WorkflowStateStep
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

            input ListWorkflowStatesWhereStepsInput {
                id: String
                id_in: [String!]
                state: WorkflowStateStateValue
                state_in: [WorkflowStateStateValue!]
                savedBy: String
                savedBy_in: [String!]
            }

            input ListWorkflowStatesWhereTeamsInput {
                id: String
                id_in: [String!]
            }

            input ListWorkflowStatesWhereNotificationsInput {
                id: String
                id_in: [String!]
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
                steps: ListWorkflowStatesWhereStepsInput
                teams: ListWorkflowStatesWhereTeamsInput
                notifications: ListWorkflowStatesWhereNotificationsInput
            }

            type WorkflowStateResponse {
                data: WorkflowState
                error: WorkflowError
            }

            type CancelWorkflowStateResponse {
                data: Boolean
                error: WorkflowError
            }

            type TakeOverWorkflowStateStepResponse {
                data: WorkflowState
                error: WorkflowError
            }

            extend type WorkflowsQuery {
                getWorkflowState(id: ID!): WorkflowStateResponse!
                # always returns active workflow state for the given targetRevisionId - or null
                getTargetWorkflowState(app: String!, targetRevisionId: ID!): WorkflowStateResponse!
                listWorkflowStates(
                    where: ListWorkflowStatesWhereInput
                    sort: [ListWorkflowStatesSort!]
                    limit: Int
                    after: String
                ): ListWorkflowStatesResponse!
                listOwnWorkflowStates(
                    where: ListWorkflowStatesWhereInput
                    sort: [ListWorkflowStatesSort!]
                    limit: Int
                    after: String
                ): ListWorkflowStatesResponse!
                listRequestedWorkflowStates(
                    where: ListWorkflowStatesWhereInput
                    sort: [ListWorkflowStatesSort!]
                    limit: Int
                    after: String
                ): ListWorkflowStatesResponse!
            }

            extend type WorkflowsMutation {
                createWorkflowState(
                    app: String!
                    targetRevisionId: ID!
                    title: String!
                ): WorkflowStateResponse!
                startWorkflowStateStep(id: ID!): WorkflowStateResponse!
                approveWorkflowStateStep(id: ID!, comment: String): WorkflowStateResponse!
                rejectWorkflowStateStep(id: ID!, comment: String!): WorkflowStateResponse!
                cancelWorkflowState(id: ID!): CancelWorkflowStateResponse!
                takeOverWorkflowStateStep(id: ID!): TakeOverWorkflowStateStepResponse!
            }
        `,
        resolvers: {
            WorkflowState: {
                isActive: (parent: Partial<IWorkflowStateModel>) => {
                    return parent.isActive || false;
                }
            },
            WorkflowsQuery: {
                getWorkflowState: async (_, args, context) => {
                    return resolve<IWorkflowStateModel>(async () => {
                        const result = await getWorkflowStateValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        const getWorkflowState = context.container.resolve(GetWorkflowStateUseCase);
                        const stateResult = await getWorkflowState.execute(result.data.id);

                        if (stateResult.isFail()) {
                            throw stateResult.error;
                        }

                        return stateResult.value;
                    });
                },
                getTargetWorkflowState: async (_, args, context) => {
                    return resolve<IWorkflowStateModel>(async () => {
                        const result = await getTargetWorkflowStateValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        const getTargetWorkflowState = context.container.resolve(
                            GetTargetWorkflowStateUseCase
                        );
                        const stateResult = await getTargetWorkflowState.execute({
                            app: result.data.app,
                            targetRevisionId: result.data.targetRevisionId
                        });

                        if (stateResult.isFail()) {
                            throw stateResult.error;
                        }

                        return stateResult.value;
                    });
                },
                listWorkflowStates: async (_, args, context) => {
                    return resolveList<IWorkflowStateModel>(async () => {
                        const result = await listWorkflowStatesValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        const listWorkflowStates =
                            context.container.resolve(ListWorkflowStatesUseCase);
                        const listResult = await listWorkflowStates.execute(result.data);

                        if (listResult.isFail()) {
                            throw listResult.error;
                        }

                        return listResult.value;
                    });
                },
                listOwnWorkflowStates: async (_, args, context) => {
                    return resolveList<IWorkflowStateModel>(async () => {
                        const result = await listWorkflowStatesValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        const listOwnWorkflowStates = context.container.resolve(
                            ListOwnWorkflowStatesUseCase
                        );
                        const listResult = await listOwnWorkflowStates.execute(result.data);

                        if (listResult.isFail()) {
                            throw listResult.error;
                        }

                        return listResult.value;
                    });
                },
                listRequestedWorkflowStates: async (_, args, context) => {
                    return resolveList<IWorkflowStateModel>(async () => {
                        const result = await listWorkflowStatesValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        const listRequestedWorkflowStates = context.container.resolve(
                            ListRequestedWorkflowStatesUseCase
                        );
                        const listResult = await listRequestedWorkflowStates.execute(result.data);

                        if (listResult.isFail()) {
                            throw listResult.error;
                        }

                        return listResult.value;
                    });
                }
            },
            WorkflowsMutation: {
                createWorkflowState: async (_, args, context) => {
                    return resolve<IWorkflowStateModel>(async () => {
                        const result = await createWorkflowStateValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        const createWorkflowState = context.container.resolve(
                            CreateWorkflowStateUseCase
                        );
                        const createResult = await createWorkflowState.execute({
                            app: result.data.app,
                            targetRevisionId: result.data.targetRevisionId,
                            title: result.data.title
                        });

                        if (createResult.isFail()) {
                            throw createResult.error;
                        }

                        return createResult.value;
                    });
                },
                startWorkflowStateStep(_, args, context) {
                    return resolve<IWorkflowStateModel>(async () => {
                        const result = await startWorkflowStateValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        const startWorkflowStateStep = context.container.resolve(
                            StartWorkflowStateStepUseCase
                        );
                        const startResult = await startWorkflowStateStep.execute(result.data.id);

                        if (startResult.isFail()) {
                            throw startResult.error;
                        }

                        return startResult.value;
                    });
                },
                approveWorkflowStateStep: (_, args, context) => {
                    return resolve<IWorkflowStateModel>(async () => {
                        const result = await approveWorkflowStateValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        const approveWorkflowStateStep = context.container.resolve(
                            ApproveWorkflowStateStepUseCase
                        );
                        const approveResult = await approveWorkflowStateStep.execute(
                            result.data.id,
                            result.data.comment
                        );

                        if (approveResult.isFail()) {
                            throw approveResult.error;
                        }

                        return approveResult.value;
                    });
                },
                rejectWorkflowStateStep: (_, args, context) => {
                    return resolve<IWorkflowStateModel>(async () => {
                        const result = await rejectWorkflowStateValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        const rejectWorkflowStateStep = context.container.resolve(
                            RejectWorkflowStateStepUseCase
                        );
                        const rejectResult = await rejectWorkflowStateStep.execute(
                            result.data.id,
                            result.data.comment
                        );

                        if (rejectResult.isFail()) {
                            throw rejectResult.error;
                        }

                        return rejectResult.value;
                    });
                },
                cancelWorkflowState: (_, args, context) => {
                    return resolve<boolean>(async () => {
                        const result = await cancelWorkflowStateValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        const cancelWorkflowState = context.container.resolve(
                            CancelWorkflowStateUseCase
                        );
                        const cancelResult = await cancelWorkflowState.execute(result.data.id);

                        if (cancelResult.isFail()) {
                            throw cancelResult.error;
                        }

                        return true;
                    });
                },
                takeOverWorkflowStateStep: (_, args, context) => {
                    return resolve<IWorkflowStateModel>(async () => {
                        const result =
                            await takeOverWorkflowStateStepValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        const takeOverWorkflowStateStep = context.container.resolve(
                            TakeOverWorkflowStateStepUseCase
                        );
                        const takeOverResult = await takeOverWorkflowStateStep.execute(
                            result.data.id
                        );

                        if (takeOverResult.isFail()) {
                            throw takeOverResult.error;
                        }

                        return takeOverResult.value;
                    });
                }
            }
        }
    });
};
