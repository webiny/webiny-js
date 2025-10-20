import ApolloClient from "apollo-client";
import type {
    IWorkflowStateGateway,
    IWorkflowStateGatewayApproveStepParams,
    IWorkflowStateGatewayApproveStepResponse,
    IWorkflowStateGatewayCancelStateResponse,
    IWorkflowStateGatewayGetTargetWorkflowStateResponse,
    IWorkflowStateGatewayListWorkflowStatesParams,
    IWorkflowStateGatewayListWorkflowStatesResponse,
    IWorkflowStateGatewayRejectStepParams,
    IWorkflowStateGatewayRejectStepResponse,
    IWorkflowStateGatewayRequestReviewStepParams,
    IWorkflowStateGatewayRequestReviewStepResponse
} from "./abstraction/WorkflowStateGateway.js";
import {
    APPROVE_WORKFLOW_STATE_STEP_MUTATION,
    CANCEL_WORKFLOW_STATE_MUTATION,
    CREATE_WORKFLOW_STATE_MUTATION,
    GET_TARGET_WORKFLOW_STATE_QUERY,
    type IApproveWorkflowStateStepResponse,
    type IApproveWorkflowStateStepVariables,
    type ICancelWorkflowStateResponse,
    type ICancelWorkflowStateVariables,
    type ICreateWorkflowStateResponse,
    type ICreateWorkflowStateVariables,
    type IGetTargetWorkflowStateResponse,
    type IGetTargetWorkflowStateVariables,
    type IListWorkflowStatesResponse,
    type IListWorkflowStatesVariables,
    type IRejectWorkflowStateStepResponse,
    type IRejectWorkflowStateStepVariables,
    LIST_WORKFLOW_STATES_QUERY,
    REJECT_WORKFLOW_STATE_STEP_MUTATION
} from "./graphql/workflowStates.js";
import { WebinyError } from "@webiny/error";

export interface IWorkflowStateGatewayParams {
    client: ApolloClient<object>;
}

export class WorkflowStateGateway implements IWorkflowStateGateway {
    private readonly client;

    public constructor(params: IWorkflowStateGatewayParams) {
        this.client = params.client;
    }

    public async approveWorkflowStateStep(
        params: IWorkflowStateGatewayApproveStepParams
    ): Promise<IWorkflowStateGatewayApproveStepResponse> {
        const { id, stepId, comment } = params;
        try {
            const result = await this.client.mutate<
                IApproveWorkflowStateStepResponse,
                IApproveWorkflowStateStepVariables
            >({
                mutation: APPROVE_WORKFLOW_STATE_STEP_MUTATION,
                variables: {
                    id,
                    stepId,
                    comment
                }
            });
            return {
                data: result.data?.workflows.approveWorkflowStateStep.data || null,
                error: result.data?.workflows.approveWorkflowStateStep.error || null
            };
        } catch (ex) {
            return {
                data: null,
                error: WebinyError.from(ex)
            };
        }
    }

    public async rejectWorkflowStateStep(
        params: IWorkflowStateGatewayRejectStepParams
    ): Promise<IWorkflowStateGatewayRejectStepResponse> {
        const { id, stepId, comment } = params;
        try {
            const result = await this.client.mutate<
                IRejectWorkflowStateStepResponse,
                IRejectWorkflowStateStepVariables
            >({
                mutation: REJECT_WORKFLOW_STATE_STEP_MUTATION,
                variables: {
                    id,
                    stepId,
                    comment
                }
            });
            return {
                data: result.data?.workflows.rejectWorkflowStateStep.data || null,
                error: result.data?.workflows.rejectWorkflowStateStep.error || null
            };
        } catch (ex) {
            return {
                data: null,
                error: WebinyError.from(ex)
            };
        }
    }

    public async cancelWorkflowState(
        id: string
    ): Promise<IWorkflowStateGatewayCancelStateResponse> {
        try {
            const result = await this.client.mutate<
                ICancelWorkflowStateResponse,
                ICancelWorkflowStateVariables
            >({
                mutation: CANCEL_WORKFLOW_STATE_MUTATION,
                variables: {
                    id
                }
            });
            return {
                data: result.data?.workflows.cancelWorkflowState.data || null,
                error: result.data?.workflows.cancelWorkflowState.error || null
            };
        } catch (ex) {
            return {
                data: null,
                error: WebinyError.from(ex)
            };
        }
    }

    public async listWorkflowStates(
        params?: IWorkflowStateGatewayListWorkflowStatesParams
    ): Promise<IWorkflowStateGatewayListWorkflowStatesResponse> {
        try {
            const result = await this.client.query<
                IListWorkflowStatesResponse,
                IListWorkflowStatesVariables
            >({
                query: LIST_WORKFLOW_STATES_QUERY,
                variables: {
                    sort: ["createdOn_DESC"],
                    ...params
                },
                fetchPolicy: "no-cache"
            });
            const error = result.data?.workflows?.listWorkflowStates?.error || null;
            const data = result.data?.workflows?.listWorkflowStates?.data || null;
            return {
                data,
                error
            };
        } catch (ex) {
            return {
                data: null,
                error: WebinyError.from(ex)
            };
        }
    }

    public async createWorkflowState(
        params: IWorkflowStateGatewayRequestReviewStepParams
    ): Promise<IWorkflowStateGatewayRequestReviewStepResponse> {
        try {
            const result = await this.client.mutate<
                ICreateWorkflowStateResponse,
                ICreateWorkflowStateVariables
            >({
                mutation: CREATE_WORKFLOW_STATE_MUTATION,
                variables: {
                    app: params.app,
                    targetRevisionId: params.targetRevisionId
                }
            });
            return {
                data: result.data?.workflows.createWorkflowState.data || null,
                error: result.data?.workflows.createWorkflowState.error || null
            };
        } catch (ex) {
            return {
                data: null,
                error: WebinyError.from(ex)
            };
        }
    }

    public async getTargetWorkflowState(
        app: string,
        targetRevisionId: string
    ): Promise<IWorkflowStateGatewayGetTargetWorkflowStateResponse> {
        try {
            const result = await this.client.query<
                IGetTargetWorkflowStateResponse,
                IGetTargetWorkflowStateVariables
            >({
                query: GET_TARGET_WORKFLOW_STATE_QUERY,
                variables: {
                    app,
                    targetRevisionId
                }
            });
            return {
                data: result.data?.workflows.getTargetWorkflowState.data || null,
                error: result.data?.workflows.getTargetWorkflowState.error || null
            };
        } catch (ex) {
            return {
                data: null,
                error: WebinyError.from(ex)
            };
        }
    }
}
