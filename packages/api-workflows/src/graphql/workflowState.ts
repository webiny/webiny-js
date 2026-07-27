import { resolve, resolveList } from "@webiny/api-graphql";
import type { IGraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { createZodError } from "@webiny/utils";
import { listWorkflowStatesValidation } from "./validation/listWorkflowStates.js";
import { startWorkflowStateValidation } from "./validation/startWorkflowState.js";
import { approveWorkflowStateValidation } from "./validation/approveWorkflowState.js";
import { rejectWorkflowStateValidation } from "./validation/rejectWorkflowState.js";
import { cancelWorkflowStateValidation } from "./validation/cancelWorkflowState.js";
import { createWorkflowStateValidation } from "./validation/createWorkflowState.js";
import { getTargetWorkflowStateValidation } from "./validation/getTargetWorkflowState.js";
import { getWorkflowStateValidation } from "./validation/getWorkflowState.js";
import { takeOverWorkflowStateStepValidation } from "./validation/takeOverWorkflowStateStep.js";
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
import { WorkflowState } from "~/domain/workflowState/WorkflowState.js";
import { WorkflowStateNotFoundError } from "~/domain/workflowState/errors.js";

export const addWorkflowStateSchema = (builder: IGraphQLSchemaBuilder): void => {
    builder.addTypeDefs(/* GraphQL */ `
        enum CmsEntryStateValue {
            pending
            inReview
            approved
            rejected
        }

        type CmsEntrySystemWorkflow {
            workflowId: String
            stepId: ID
            stepName: String
            state: CmsEntryStateValue
        }

        extend type CmsEntrySystem {
            workflow: CmsEntrySystemWorkflow
        }

        input ListWhereInputCmsEntrySystemWorkflowStateInput {
            workflowId: String
            stepId: ID
            stepName: String
            state: CmsEntryStateValue
        }

        input ListWhereInputCmsEntrySystemWorkflowInput {
            workflowId: String
            stepId: ID
            state: ListWhereInputCmsEntrySystemWorkflowStateInput
            stepName: String
        }

        extend input ListWhereInputCmsEntrySystem {
            workflow: ListWhereInputCmsEntrySystemWorkflowInput
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
            state: CmsEntryStateValue!
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
            state: CmsEntryStateValue!
            steps: [WorkflowStateStep!]
            createdOn: DateTime!
            savedOn: DateTime!
            createdBy: WorkflowStateIdentity!
            savedBy: WorkflowStateIdentity!
            currentStep: WorkflowStateStep!
            nextStep: WorkflowStateStep
            previousStep: WorkflowStateStep
            targetContext: JSON
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
            state: CmsEntryStateValue
            state_in: [CmsEntryStateValue!]
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
            state: CmsEntryStateValue
            state_in: [CmsEntryStateValue!]
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
    `);

    builder.addResolver<unknown, Partial<WorkflowState>>({
        path: "WorkflowState.isActive",
        dependencies: [],
        resolver: () => ({ parent }) => parent.isActive || false
    });

    builder.addResolver({
        path: "WorkflowsQuery.getWorkflowState",
        dependencies: [GetWorkflowStateUseCase],
        resolver(getWorkflowState) {
            return ({ args }) =>
                resolve<WorkflowState>(async () => {
                    const result = await getWorkflowStateValidation.safeParseAsync(args);
                    if (!result.success) {
                        throw createZodError(result.error);
                    }

                    const stateResult = await getWorkflowState.execute(result.data.id);

                    if (stateResult.isFail()) {
                        throw stateResult.error;
                    }

                    return stateResult.value;
                });
        }
    });

    builder.addResolver({
        path: "WorkflowsQuery.getTargetWorkflowState",
        dependencies: [GetTargetWorkflowStateUseCase],
        resolver(getTargetWorkflowState) {
            return ({ args }) =>
                resolve<WorkflowState | null>(async () => {
                    const result = await getTargetWorkflowStateValidation.safeParseAsync(args);
                    if (!result.success) {
                        throw createZodError(result.error);
                    }

                    const stateResult = await getTargetWorkflowState.execute({
                        app: result.data.app,
                        targetRevisionId: result.data.targetRevisionId
                    });
                    /**
                     * TODO determine if we want to throw error or return null when not found.
                     */
                    if (stateResult.isFail()) {
                        if (stateResult.error instanceof WorkflowStateNotFoundError) {
                            return null;
                        }
                        throw stateResult.error;
                    }

                    return stateResult.value;
                });
        }
    });

    builder.addResolver({
        path: "WorkflowsQuery.listWorkflowStates",
        dependencies: [ListWorkflowStatesUseCase],
        resolver(listWorkflowStates) {
            return ({ args }) =>
                resolveList<WorkflowState>(async () => {
                    const result = await listWorkflowStatesValidation.safeParseAsync(args);
                    if (!result.success) {
                        throw createZodError(result.error);
                    }

                    const listResult = await listWorkflowStates.execute({
                        ...result.data,
                        where: {
                            values: {
                                ...result.data?.where
                            }
                        }
                    });

                    if (listResult.isFail()) {
                        throw listResult.error;
                    }

                    return listResult.value;
                });
        }
    });

    builder.addResolver({
        path: "WorkflowsQuery.listOwnWorkflowStates",
        dependencies: [ListOwnWorkflowStatesUseCase],
        resolver(listOwnWorkflowStates) {
            return ({ args }) =>
                resolveList<WorkflowState>(async () => {
                    const result = await listWorkflowStatesValidation.safeParseAsync(args);
                    if (!result.success) {
                        throw createZodError(result.error);
                    }

                    const listResult = await listOwnWorkflowStates.execute({
                        ...result.data,
                        where: {
                            values: {
                                ...result.data?.where
                            }
                        }
                    });

                    if (listResult.isFail()) {
                        throw listResult.error;
                    }

                    return listResult.value;
                });
        }
    });

    builder.addResolver({
        path: "WorkflowsQuery.listRequestedWorkflowStates",
        dependencies: [ListRequestedWorkflowStatesUseCase],
        resolver(listRequestedWorkflowStates) {
            return ({ args }) =>
                resolveList<WorkflowState>(async () => {
                    const result = await listWorkflowStatesValidation.safeParseAsync(args);
                    if (!result.success) {
                        throw createZodError(result.error);
                    }

                    const listResult = await listRequestedWorkflowStates.execute({
                        ...result.data,
                        where: {
                            values: {
                                ...result.data?.where
                            }
                        }
                    });

                    if (listResult.isFail()) {
                        throw listResult.error;
                    }

                    return listResult.value;
                });
        }
    });

    builder.addResolver({
        path: "WorkflowsMutation.createWorkflowState",
        dependencies: [CreateWorkflowStateUseCase],
        resolver(createWorkflowState) {
            return ({ args }) =>
                resolve<WorkflowState>(async () => {
                    const result = await createWorkflowStateValidation.safeParseAsync(args);
                    if (!result.success) {
                        throw createZodError(result.error);
                    }

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
        }
    });

    builder.addResolver({
        path: "WorkflowsMutation.startWorkflowStateStep",
        dependencies: [StartWorkflowStateStepUseCase],
        resolver(startWorkflowStateStep) {
            return ({ args }) =>
                resolve<WorkflowState>(async () => {
                    const result = await startWorkflowStateValidation.safeParseAsync(args);
                    if (!result.success) {
                        throw createZodError(result.error);
                    }

                    const startResult = await startWorkflowStateStep.execute(result.data.id);

                    if (startResult.isFail()) {
                        throw startResult.error;
                    }

                    return startResult.value;
                });
        }
    });

    builder.addResolver({
        path: "WorkflowsMutation.approveWorkflowStateStep",
        dependencies: [ApproveWorkflowStateStepUseCase],
        resolver(approveWorkflowStateStep) {
            return ({ args }) =>
                resolve<WorkflowState>(async () => {
                    const result = await approveWorkflowStateValidation.safeParseAsync(args);
                    if (!result.success) {
                        throw createZodError(result.error);
                    }

                    const approveResult = await approveWorkflowStateStep.execute(
                        result.data.id,
                        result.data.comment
                    );

                    if (approveResult.isFail()) {
                        throw approveResult.error;
                    }

                    return approveResult.value;
                });
        }
    });

    builder.addResolver({
        path: "WorkflowsMutation.rejectWorkflowStateStep",
        dependencies: [RejectWorkflowStateStepUseCase],
        resolver(rejectWorkflowStateStep) {
            return ({ args }) =>
                resolve<WorkflowState>(async () => {
                    const result = await rejectWorkflowStateValidation.safeParseAsync(args);
                    if (!result.success) {
                        throw createZodError(result.error);
                    }

                    const rejectResult = await rejectWorkflowStateStep.execute(
                        result.data.id,
                        result.data.comment
                    );

                    if (rejectResult.isFail()) {
                        throw rejectResult.error;
                    }

                    return rejectResult.value;
                });
        }
    });

    builder.addResolver({
        path: "WorkflowsMutation.cancelWorkflowState",
        dependencies: [CancelWorkflowStateUseCase],
        resolver(cancelWorkflowState) {
            return ({ args }) =>
                resolve<boolean>(async () => {
                    const result = await cancelWorkflowStateValidation.safeParseAsync(args);
                    if (!result.success) {
                        throw createZodError(result.error);
                    }

                    const cancelResult = await cancelWorkflowState.execute(result.data.id);

                    if (cancelResult.isFail()) {
                        throw cancelResult.error;
                    }

                    return true;
                });
        }
    });

    builder.addResolver({
        path: "WorkflowsMutation.takeOverWorkflowStateStep",
        dependencies: [TakeOverWorkflowStateStepUseCase],
        resolver(takeOverWorkflowStateStep) {
            return ({ args }) =>
                resolve<WorkflowState>(async () => {
                    const result = await takeOverWorkflowStateStepValidation.safeParseAsync(args);
                    if (!result.success) {
                        throw createZodError(result.error);
                    }

                    const takeOverResult = await takeOverWorkflowStateStep.execute(result.data.id);

                    if (takeOverResult.isFail()) {
                        throw takeOverResult.error;
                    }

                    return takeOverResult.value;
                });
        }
    });
};
