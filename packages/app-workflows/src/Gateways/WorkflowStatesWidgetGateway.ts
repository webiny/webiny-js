import type ApolloClient from "apollo-client";
import type {
    IWorkflowStatesWidgetGateway,
    IWorkflowStatesWidgetGatewayApproveStateParams,
    IWorkflowStatesWidgetGatewayApproveStateResponse,
    IWorkflowStatesWidgetGatewayDeclineStateParams,
    IWorkflowStatesWidgetGatewayDeclineStateResponse,
    IWorkflowStatesWidgetGatewayListOwnStatesParams,
    IWorkflowStatesWidgetGatewayListOwnStatesResponse,
    IWorkflowStatesWidgetGatewayListRequestedStatesParams,
    IWorkflowStatesWidgetGatewayListRequestedStatesResponse
} from "./abstraction/WorkflowStatesWidgetGateway.js";
import {
    APPROVE_WORKFLOW_STATE_STEP_MUTATION,
    type IApproveWorkflowStateStepResponse,
    type IApproveWorkflowStateStepVariables,
    type IListOwnWorkflowStatesResponse,
    type IListOwnWorkflowStatesVariables,
    type IListRequestedWorkflowStatesResponse,
    type IListRequestedWorkflowStatesVariables,
    type IRejectWorkflowStateStepResponse,
    type IRejectWorkflowStateStepVariables,
    LIST_OWN_WORKFLOW_STATES,
    LIST_REQUESTED_WORKFLOW_STATES,
    REJECT_WORKFLOW_STATE_STEP_MUTATION
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

    public async approveState(
        params: IWorkflowStatesWidgetGatewayApproveStateParams
    ): Promise<IWorkflowStatesWidgetGatewayApproveStateResponse> {
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

    public async declineState(
        params: IWorkflowStatesWidgetGatewayDeclineStateParams
    ): Promise<IWorkflowStatesWidgetGatewayDeclineStateResponse> {
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
