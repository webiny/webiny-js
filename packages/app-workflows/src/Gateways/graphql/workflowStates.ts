import type { IGenericMeta, IWorkflowState, WorkflowStateValue } from "~/types.js";
import gql from "graphql-tag";
import type { IWorkflowStateError } from "~/Gateways/abstraction/WorkflowStateGateway.js";

const ERROR_FIELD = /* GraphQL */ `
    error {
        code
        message
        data
    }
`;

const META_FIELDS = /* GraphQL */ `
    meta {
        totalCount
        hasMoreItems
        cursor
    }
`;

const WORKFLOW_STATE_STEP_FIELDS = `
{
    id
    title
    color
    description
    teams {
        id
    }
    notifications {
        id
    }
    comment
    savedBy {
        id
        displayName
        type
    }
    state
    canReview
    canTakeOver
    isOwner
}
`;

const WORKFLOW_STATE = /* GraphQL */ `
    {
        id
        isActive
        app
        title
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
        steps ${WORKFLOW_STATE_STEP_FIELDS}
        previousStep ${WORKFLOW_STATE_STEP_FIELDS}
        nextStep ${WORKFLOW_STATE_STEP_FIELDS}
        currentStep ${WORKFLOW_STATE_STEP_FIELDS}
    }
`;

export interface ICreateWorkflowStateVariables {
    app: string;
    targetRevisionId: string;
    title: string;
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
    mutation CreateWorkflowState($app: String!, $targetRevisionId: ID!, $title: String!) {
        workflows {
            createWorkflowState(app: $app, targetRevisionId: $targetRevisionId, title: $title) {
                data ${WORKFLOW_STATE}
                ${ERROR_FIELD}
            }
        }
    }
`;

export interface IStartWorkflowStateStepVariables {
    id: string;
}

export interface IStartWorkflowStateStepResponse {
    workflows: {
        startWorkflowStateStep: {
            data: IWorkflowState | null;
            error: IWorkflowStateError | null;
        };
    };
}

export const START_WORKFLOW_STATE_STEP_MUTATION = gql`
    mutation StartWorkflowStateStep($id: ID!) {
        workflows {
            startWorkflowStateStep(id: $id) {
                data ${WORKFLOW_STATE}
                ${ERROR_FIELD}
            }
        }
    }
`;

export interface IApproveWorkflowStateStepVariables {
    id: string;
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
    mutation ApproveWorkflowStateStep($id: ID!, $comment: String) {
        workflows {
            approveWorkflowStateStep(id: $id, comment: $comment) {
                data ${WORKFLOW_STATE}
                ${ERROR_FIELD}
            }
        }
    }
`;

export interface IRejectWorkflowStateStepVariables {
    id: string;
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
    mutation RejectWorkflowStateStep($id: ID!, $comment: String!) {
        workflows {
            rejectWorkflowStateStep(id: $id, comment: $comment) {
                data ${WORKFLOW_STATE}
                ${ERROR_FIELD}
            }
        }
    }`;

export interface ITakeOverWorkflowStateStepVariables {
    id: string;
}

export interface ITakeOverWorkflowStateStepResponse {
    workflows: {
        takeOverWorkflowStateStep: {
            data: IWorkflowState | null;
            error: IWorkflowStateError | null;
        };
    };
}

export const TAKE_OVER_WORKFLOW_STATE_STEP_MUTATION = gql`
    mutation TakeOverWorkflowStateStep($id: ID!) {
        workflows {
            takeOverWorkflowStateStep(id: $id) {
                data ${WORKFLOW_STATE}
                ${ERROR_FIELD}
            }
        }
    }
`;

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

export interface IListWorkflowStatesVariablesWhereSteps {
    id?: string;
    id_in?: string[];
    state?: WorkflowStateValue;
    state_in?: WorkflowStateValue[];
    savedBy?: string;
    savedBy_in?: string[];
}

export interface IListWorkflowStatesVariablesWhereTeams {
    id?: string;
    id_in?: string[];
}

export interface IListWorkflowStatesVariablesWhereNotifications {
    id?: string;
    id_in?: string[];
}

export interface IListWorkflowStatesVariablesWhere {
    app?: string;
    app_in?: string[];
    targetId?: string;
    targetId_in?: string[];
    targetRevisionId?: string;
    targetRevisionId_in?: string[];
    state?: WorkflowStateValue;
    state_in?: WorkflowStateValue[];
    createdBy?: string;
    createdBy_in?: string[];
    savedBy?: string;
    savedBy_in?: string[];
    steps?: IListWorkflowStatesVariablesWhereSteps;
    teams?: IListWorkflowStatesVariablesWhereTeams;
    notifications?: IListWorkflowStatesVariablesWhereNotifications;
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
            meta: IGenericMeta | null;
            error: IWorkflowStateError | null;
        };
    };
}

export const LIST_WORKFLOW_STATES_QUERY = gql`
    query ListWorkflowStates($where: ListWorkflowStatesWhereInput, $limit: Int, $sort: [ListWorkflowStatesSort!], $after: String) {
        workflows {
            listWorkflowStates(where: $where, limit: $limit, sort: $sort, after: $after) {
                data ${WORKFLOW_STATE}
                ${META_FIELDS}
                ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_OWN_WORKFLOW_STATES_QUERY = gql`
    query ListOwnWorkflowStates($where: ListWorkflowStatesWhereInput, $limit: Int, $sort: [ListWorkflowStatesSort!], $after: String) {
        workflows {
            listWorkflowStates: listOwnWorkflowStates(where: $where, limit: $limit, sort: $sort, after: $after) {
                data ${WORKFLOW_STATE}
                ${META_FIELDS}
                ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_REQUESTED_WORKFLOW_STATES_QUERY = gql`
    query ListRequestedWorkflowStates($where: ListWorkflowStatesWhereInput, $limit: Int, $sort: [ListWorkflowStatesSort!], $after: String) {
        workflows {
            listWorkflowStates: listRequestedWorkflowStates(where: $where, limit: $limit, sort: $sort, after: $after) {
                data ${WORKFLOW_STATE}
                ${META_FIELDS}
                ${ERROR_FIELD}
            }
        }
    }
`;
