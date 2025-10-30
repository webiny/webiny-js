import type ApolloClient from "apollo-client";
import type {
    IWorkflowStatesWidgetGateway,
    IWorkflowStatesWidgetGatewayApproveStateStepParams,
    IWorkflowStatesWidgetGatewayApproveStateStepResponse,
    IWorkflowStatesWidgetGatewayListOwnStatesParams,
    IWorkflowStatesWidgetGatewayListOwnStatesResponse,
    IWorkflowStatesWidgetGatewayListRequestedStatesParams,
    IWorkflowStatesWidgetGatewayListRequestedStatesResponse,
    IWorkflowStatesWidgetGatewayRejectStateStepParams,
    IWorkflowStatesWidgetGatewayRejectStateStepResponse,
    IWorkflowStatesWidgetGatewayStartStateStepParams,
    IWorkflowStatesWidgetGatewayStartStateStepResponse
} from "./abstraction/WorkflowStatesWidgetGateway.js";
import type {
    IApproveWorkflowStateStepResponse,
    IApproveWorkflowStateStepVariables,
    IListOwnWorkflowStatesResponse,
    IListOwnWorkflowStatesVariables,
    IListRequestedWorkflowStatesResponse,
    IListRequestedWorkflowStatesVariables,
    IRejectWorkflowStateStepResponse,
    IRejectWorkflowStateStepVariables,
    IStartWorkflowStateStepResponse,
    IStartWorkflowStateStepVariables
} from "~/Gateways/graphql/workflowStates.js";
import {
    APPROVE_WORKFLOW_STATE_STEP_MUTATION,
    LIST_OWN_WORKFLOW_STATES,
    LIST_REQUESTED_WORKFLOW_STATES,
    REJECT_WORKFLOW_STATE_STEP_MUTATION,
    START_WORKFLOW_STATE_STEP_MUTATION
} from "~/Gateways/graphql/workflowStates.js";

interface IWorkflowStatesWidgetGatewayParams {
    client: ApolloClient<object>;
}

export class WorkflowStatesWidgetGateway implements IWorkflowStatesWidgetGateway {
    private readonly client;

    public constructor(params: IWorkflowStatesWidgetGatewayParams) {
        this.client = params.client;
    }

    public async listOwnStates(
        params: IWorkflowStatesWidgetGatewayListOwnStatesParams
    ): Promise<IWorkflowStatesWidgetGatewayListOwnStatesResponse> {
        try {
            const result = await this.client.query<
                IListOwnWorkflowStatesResponse,
                IListOwnWorkflowStatesVariables
            >({
                query: LIST_OWN_WORKFLOW_STATES,
                variables: {
                    ...params
                },
                fetchPolicy: "no-cache"
            });
            return {
                data: result.data.workflows.listOwnWorkflowStates.data,
                meta: result.data.workflows.listOwnWorkflowStates.meta,
                error: result.data.workflows.listOwnWorkflowStates.error
            };
        } catch (ex) {
            return {
                data: null,
                meta: null,
                error: ex
            };
        }
    }

    public async listRequestedStates(
        params: IWorkflowStatesWidgetGatewayListRequestedStatesParams
    ): Promise<IWorkflowStatesWidgetGatewayListRequestedStatesResponse> {
        try {
            const result = await this.client.query<
                IListRequestedWorkflowStatesResponse,
                IListRequestedWorkflowStatesVariables
            >({
                query: LIST_REQUESTED_WORKFLOW_STATES,
                variables: {
                    ...params
                },
                fetchPolicy: "no-cache"
            });
            return {
                data: result.data.workflows.listRequestedWorkflowStates.data,
                meta: result.data.workflows.listRequestedWorkflowStates.meta,
                error: result.data.workflows.listRequestedWorkflowStates.error
            };
        } catch (ex) {
            return {
                data: null,
                meta: null,
                error: ex
            };
        }
    }
    public async startStateStep(
        params: IWorkflowStatesWidgetGatewayStartStateStepParams
    ): Promise<IWorkflowStatesWidgetGatewayStartStateStepResponse> {
        try {
            const result = await this.client.mutate<
                IStartWorkflowStateStepResponse,
                IStartWorkflowStateStepVariables
            >({
                mutation: START_WORKFLOW_STATE_STEP_MUTATION,
                variables: {
                    ...params
                },
                fetchPolicy: "no-cache"
            });
            return {
                data: result.data!.workflows.startWorkflowStateStep.data,
                error: result.data!.workflows.startWorkflowStateStep.error
            };
        } catch (ex) {
            return {
                data: null,
                error: ex
            };
        }
    }

    public async approveStateStep(
        params: IWorkflowStatesWidgetGatewayApproveStateStepParams
    ): Promise<IWorkflowStatesWidgetGatewayApproveStateStepResponse> {
        try {
            const result = await this.client.mutate<
                IApproveWorkflowStateStepResponse,
                IApproveWorkflowStateStepVariables
            >({
                mutation: APPROVE_WORKFLOW_STATE_STEP_MUTATION,
                variables: {
                    ...params
                },
                fetchPolicy: "no-cache"
            });
            return {
                data: result.data!.workflows.approveWorkflowStateStep.data,
                error: result.data!.workflows.approveWorkflowStateStep.error
            };
        } catch (ex) {
            return {
                data: null,
                error: ex
            };
        }
    }

    public async rejectStateStep(
        params: IWorkflowStatesWidgetGatewayRejectStateStepParams
    ): Promise<IWorkflowStatesWidgetGatewayRejectStateStepResponse> {
        try {
            const result = await this.client.mutate<
                IRejectWorkflowStateStepResponse,
                IRejectWorkflowStateStepVariables
            >({
                mutation: REJECT_WORKFLOW_STATE_STEP_MUTATION,
                variables: {
                    ...params
                },
                fetchPolicy: "no-cache"
            });
            return {
                data: result.data!.workflows.rejectWorkflowStateStep.data,
                error: result.data!.workflows.rejectWorkflowStateStep.error
            };
        } catch (ex) {
            return {
                data: null,
                error: ex
            };
        }
    }
}
