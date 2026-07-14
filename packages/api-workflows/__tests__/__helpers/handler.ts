import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import { FULL_ACCESS_TEAM_ID } from "@webiny/api-core-testing";
import { BackgroundTasksFeature, TaskService } from "@webiny/background-tasks/api";
import { createMockTaskService } from "@webiny/project-utils/testing/tasks/mockTaskTriggerTransportPlugin.js";
import { RequestContextInitializer } from "@webiny/event-handler-core";
import { WorkflowsFeature } from "~/WorkflowsFeature.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { WORKFLOW_MODEL_ID, WORKFLOW_STATE_MODEL_ID } from "~/constants.js";
import { GetUserTeamsUseCase } from "~/features/internal/GetUserTeams/index.js";
import { Result } from "@webiny/feature/api";
import {
    APPROVE_WORKFLOW_STATE_STEP_MUTATION,
    CANCEL_WORKFLOW_STATE_MUTATION,
    CREATE_WORKFLOW_STATE_MUTATION,
    DELETE_WORKFLOW_MUTATION,
    GET_TARGET_WORKFLOW_STATE_QUERY,
    GET_WORKFLOW_QUERY,
    GET_WORKFLOW_STATE_MUTATION,
    type IApproveWorkflowStateStepResponse,
    type IApproveWorkflowStateStepVariables,
    ICancelWorkflowStateResponse,
    ICancelWorkflowStateVariables,
    type ICreateWorkflowStateResponse,
    type ICreateWorkflowStateVariables,
    type IDeleteWorkflowResponse,
    type IDeleteWorkflowVariables,
    type IGetTargetWorkflowStateResponse,
    type IGetTargetWorkflowStateVariables,
    type IGetWorkflowResponse,
    IGetWorkflowStateResponse,
    IGetWorkflowStateVariables,
    type IGetWorkflowVariables,
    type IListOwnWorkflowStatesResponse,
    IListOwnWorkflowStatesVariables,
    type IListRequestedWorkflowStatesResponse,
    type IListRequestedWorkflowStatesVariables,
    type IListTargetWorkflowStatesResponse,
    type IListTargetWorkflowStatesVariables,
    type IListWorkflowResponse,
    type IListWorkflowVariables,
    type IRejectWorkflowStateStepResponse,
    type IRejectWorkflowStateStepVariables,
    IStartWorkflowStateStepResponse,
    IStartWorkflowStateStepVariables,
    type IStoreWorkflowResponse,
    type IStoreWorkflowVariables,
    type ITakeOverWorkflowStateStepResponse,
    type ITakeOverWorkflowStateStepVariables,
    LIST_OWN_WORKFLOW_STATES_QUERY,
    LIST_REQUESTED_WORKFLOW_STATES_QUERY,
    LIST_TARGET_WORKFLOW_STATES_QUERY,
    LIST_WORKFLOWS_QUERY,
    REJECT_WORKFLOW_STATE_STEP_MUTATION,
    START_WORKFLOW_STATE_STEP_MUTATION,
    STORE_WORKFLOW_MUTATION,
    TAKE_OVER_WORKFLOW_STATE_STEP_MUTATION
} from "./graphql.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";

class GetUserTeamsUseCaseDecorator implements GetUserTeamsUseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private decoratee: GetUserTeamsUseCase.Interface
    ) {}

    async execute(userId: string) {
        const identity = this.identityContext.getIdentity();

        // Return teams from identity if userId matches current identity AND it carries explicit
        // teams. The DI-native auth layer normalizes a team-less identity to `teams: []` (rather
        // than leaving it undefined), so guard on length — an empty array means "no explicit teams".
        if (identity.id === userId && identity.teams && identity.teams.length > 0) {
            return Result.ok(identity.teams.map(teamId => ({ id: teamId })));
        }

        // Otherwise return full access team as default
        return Result.ok([{ id: FULL_ACCESS_TEAM_ID }]);
    }
}

const GetUserTeamsTestMock = GetUserTeamsUseCase.createDecorator({
    decorator: GetUserTeamsUseCaseDecorator,
    dependencies: [IdentityContext]
});

export const createContextHandler = async (params: CmsTestHandlerParams = {}) => {
    const handler = createCmsTestHandler({
        ...params,
        features: container => {
            // Background tasks were registered globally by the retired useContextHandler.
            BackgroundTasksFeature.register(container);
            WorkflowsFeature.register(container);
            // GetUserTeamsUseCase is registered inside WorkflowsInitializer.init() (post-auth), so
            // the mock decorator must be applied AFTER that runs. This RequestContextInitializer is
            // registered after WorkflowsFeature, so it runs after WorkflowsInitializer and can wrap
            // the (now-registered) GetUserTeamsUseCase with the test mock.
            container.registerInstance(RequestContextInitializer, {
                async init(ctx: Record<string, any>) {
                    ctx.container.registerDecorator(GetUserTeamsTestMock);
                }
            });
            container.registerInstance(TaskService, createMockTaskService());
        },
        permissions: [
            {
                name: "*"
            }
        ]
    });
    const context = await handler.getContext();
    const workflowModelResult = await context.container
        .resolve(GetModelUseCase)
        .execute(WORKFLOW_MODEL_ID);
    const workflowModel = workflowModelResult.value;
    const stateModelResult = await context.container
        .resolve(GetModelUseCase)
        .execute(WORKFLOW_STATE_MODEL_ID);
    const stateModel = stateModelResult.value;
    return {
        handler,
        context,
        workflowModel,
        stateModel
    };
};

export const createGraphQLHandler = (params: CmsTestHandlerParams = {}) => {
    const handler = createCmsTestHandler({
        ...params,
        features: container => {
            // Background tasks were registered globally by the retired useGraphQLHandler.
            BackgroundTasksFeature.register(container);
            WorkflowsFeature.register(container);
            // GetUserTeamsUseCase is registered inside WorkflowsInitializer.init() (post-auth), so
            // the mock decorator must be applied AFTER that runs. This RequestContextInitializer is
            // registered after WorkflowsFeature, so it runs after WorkflowsInitializer and can wrap
            // the (now-registered) GetUserTeamsUseCase with the test mock.
            container.registerInstance(RequestContextInitializer, {
                async init(ctx: Record<string, any>) {
                    ctx.container.registerDecorator(GetUserTeamsTestMock);
                }
            });
            container.registerInstance(TaskService, createMockTaskService());
        },
        permissions: [
            {
                name: "*"
            }
        ]
    });
    return {
        handler,
        /**
         * Workflows
         */
        storeWorkflow: handler.createMutation<IStoreWorkflowVariables, IStoreWorkflowResponse>(
            STORE_WORKFLOW_MUTATION
        ),
        deleteWorkflow: handler.createMutation<IDeleteWorkflowVariables, IDeleteWorkflowResponse>(
            DELETE_WORKFLOW_MUTATION
        ),
        getWorkflow: handler.createQuery<IGetWorkflowVariables, IGetWorkflowResponse>(
            GET_WORKFLOW_QUERY
        ),
        listWorkflows: handler.createQuery<IListWorkflowVariables, IListWorkflowResponse>(
            LIST_WORKFLOWS_QUERY
        ),
        /**
         * Workflow states
         */
        createWorkflowState: handler.createQuery<
            ICreateWorkflowStateVariables,
            ICreateWorkflowStateResponse
        >(CREATE_WORKFLOW_STATE_MUTATION),
        getTargetWorkflowState: handler.createQuery<
            IGetTargetWorkflowStateVariables,
            IGetTargetWorkflowStateResponse
        >(GET_TARGET_WORKFLOW_STATE_QUERY),
        listWorkflowStates: handler.createQuery<
            IListTargetWorkflowStatesVariables,
            IListTargetWorkflowStatesResponse
        >(LIST_TARGET_WORKFLOW_STATES_QUERY),
        listOwnWorkflowStates: handler.createQuery<
            IListOwnWorkflowStatesVariables,
            IListOwnWorkflowStatesResponse
        >(LIST_OWN_WORKFLOW_STATES_QUERY),
        listRequestedWorkflowStates: handler.createQuery<
            IListRequestedWorkflowStatesVariables,
            IListRequestedWorkflowStatesResponse
        >(LIST_REQUESTED_WORKFLOW_STATES_QUERY),
        startWorkflowStateStep: handler.createMutation<
            IStartWorkflowStateStepVariables,
            IStartWorkflowStateStepResponse
        >(START_WORKFLOW_STATE_STEP_MUTATION),
        takeOverWorkflowStateStep: handler.createMutation<
            ITakeOverWorkflowStateStepVariables,
            ITakeOverWorkflowStateStepResponse
        >(TAKE_OVER_WORKFLOW_STATE_STEP_MUTATION),
        approveWorkflowStateStep: handler.createMutation<
            IApproveWorkflowStateStepVariables,
            IApproveWorkflowStateStepResponse
        >(APPROVE_WORKFLOW_STATE_STEP_MUTATION),
        rejectWorkflowStateStep: handler.createMutation<
            IRejectWorkflowStateStepVariables,
            IRejectWorkflowStateStepResponse
        >(REJECT_WORKFLOW_STATE_STEP_MUTATION),
        cancelWorkflowState: handler.createMutation<
            ICancelWorkflowStateVariables,
            ICancelWorkflowStateResponse
        >(CANCEL_WORKFLOW_STATE_MUTATION),
        getWorkflowState: handler.createQuery<
            IGetWorkflowStateVariables,
            IGetWorkflowStateResponse
        >(GET_WORKFLOW_STATE_MUTATION)
    };
};
