import type { IWorkflowState } from "~/types.js";
import gql from "graphql-tag";
import type { IWorkflowStateError } from "~/Gateways/abstraction/WorkflowStateGateway.js";

const ERROR_FIELD = /* GraphQL */ `
    error {
        code
        message
        data
    }
`;

const WORKFLOW_STATE = /* GraphQL */ `
    {
        id
        app
        targetId
        targetRevisionId
        comment
        state
        createdOn
        savedOn
        createdBy {
            id
            displayName
            type
        }
        savedBy {
            id
            displayName
            type
        }
        steps {
            id
            comment
            savedBy {
                id
                displayName
                type
            }
            state
        }
    }
`;

export interface ICreateWorkflowStateVariables {
    app: string;
    targetRevisionId: string;
}

export interface ICreateWorkflowStateResponse {
    workflows: {
        createWorkflowState: {
            data: IWorkflowState | null;
            error: IWorkflowStateError | null;
        };
    };
}

export const CREATE_WORKFLOW_STATE_MUTATION = gql`
    mutation CreateWorkflowState($app: String!, $targetRevisionId: ID!) {
        workflows {
            createWorkflowState(app: $app, targetRevisionId: $targetRevisionId) {
                data ${WORKFLOW_STATE}
                ${ERROR_FIELD}
            }
        }
    }
`;

export interface IApproveWorkflowStateStepVariables {
    id: string;
    stepId: string;
    comment?: string;
}

export interface IApproveWorkflowStateStepResponse {
    workflows: {
        approveWorkflowStateStep: {
            data: IWorkflowState | null;
            error: IWorkflowStateError | null;
        };
    };
}

export const APPROVE_WORKFLOW_STATE_STEP_MUTATION = gql`
    mutation ApproveWorkflowStateStep($id: ID!, $stepId: ID!, $comment: String) {
        workflows {
            approveWorkflowStateStep(id: $id, stepId: $stepId, comment: $comment) {
                data ${WORKFLOW_STATE}
                ${ERROR_FIELD}
            }
        }
    }
`;

export interface IRejectWorkflowStateStepVariables {
    id: string;
    stepId: string;
    comment: string;
}

export interface IRejectWorkflowStateStepResponse {
    workflows: {
        rejectWorkflowStateStep: {
            data: IWorkflowState | null;
            error: IWorkflowStateError | null;
        };
    };
}

export const REJECT_WORKFLOW_STATE_STEP_MUTATION = gql`
    mutation RejectWorkflowStateStep($id: ID!, $stepId: ID!, $comment: String!) {
        workflows {
            rejectWorkflowStateStep(id: $id, stepId: $stepId, comment: $comment) {
                data ${WORKFLOW_STATE}
                ${ERROR_FIELD}
                
            }
        }
    }`;

export interface ICancelWorkflowStateVariables {
    id: string;
}

export interface ICancelWorkflowStateResponse {
    workflows: {
        cancelWorkflowState: {
            data: boolean | null;
            error: IWorkflowStateError | null;
        };
    };
}

export const CANCEL_WORKFLOW_STATE_MUTATION = gql`
    mutation CancelWorkflowState($id: ID!) {
        workflows {
            cancelWorkflowState(id: $id) {
                data
                ${ERROR_FIELD}
            }
        }
    }
`;

export interface IGetTargetWorkflowStateVariables {
    app: string;
    targetRevisionId: string;
}

export interface IGetTargetWorkflowStateResponse {
    workflows: {
        getTargetWorkflowState: {
            data: IWorkflowState | null;
            error: IWorkflowStateError | null;
        };
    };
}

export const GET_TARGET_WORKFLOW_STATE_QUERY = gql`
    query GetTargetWorkflowState($app: String!, $targetRevisionId: ID!) {
        workflows {
            getTargetWorkflowState(app: $app, targetRevisionId: $targetRevisionId) {
                data ${WORKFLOW_STATE}
                ${ERROR_FIELD}
            }
        }
    }
`;

export interface IListWorkflowStatesVariablesWhere {
    app?: string;
    app_in?: string[];
    targetId?: string;
    targetId_in?: string[];
    targetRevisionId?: string;
    targetRevisionId_in?: string[];
}

export interface IListWorkflowStatesVariables {
    where?: IListWorkflowStatesVariablesWhere;
    limit?: number;
    sort?: ["createdOn_ASC" | "createdOn_DESC"];
    after?: string;
}

export interface IListWorkflowStatesResponse {
    workflows: {
        listWorkflowStates: {
            data: IWorkflowState[] | null;
            error: IWorkflowStateError | null;
        };
    };
}

export const LIST_WORKFLOW_STATES_QUERY = gql`
    query ListWorkflowStates($where: ListWorkflowStatesWhereInput, $limit: Number, $sort: [ListWorkflowStatesSort!], $after: String) {
        workflows {
            listWorkflowStates(where: $where, limit: $limit, sort: $sort, after: $after) {
                data ${WORKFLOW_STATE}
                ${ERROR_FIELD}
            }
        }
    }
`;
