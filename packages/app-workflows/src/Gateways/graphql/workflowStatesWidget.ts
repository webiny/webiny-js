import gql from "graphql-tag";
import type { IWorkflowStatesWidgetItem } from "~/types.js";
import type {
    IWorkflowStatesWidgetError,
    IWorkflowStatesWidgetMeta
} from "~/Gateways/abstraction/WorkflowStatesWidgetGateway.js";

const WORKFLOW_STATE_FIELDS = /* GraphQL */ `
    id
    app
    title
    targetRevisionId
    state
    savedBy {
        id
        displayName
    }
    savedOn
    step {
        id
        title
        color
        description
    }
`;

export interface IListWidgetWorkflowStatesParamsWhere {
    state: string;
}

export interface IListOwnWorkflowStatesVariables {
    where: IListWidgetWorkflowStatesParamsWhere;
}

export interface IListOwnWorkflowStatesResponse {
    data: {
        listOwnWorkflowStates: {
            data: IWorkflowStatesWidgetItem[] | null;
            meta: IWorkflowStatesWidgetMeta | null;
            error: IWorkflowStatesWidgetError | null
        }
    };
}


export const LIST_OWN_WORKFLOW_STATES = gql`
    query ListOwnWorkflowStates($where: ListWidgetWorkflowStatesWhereInput!, $limit: Int) {
        listOwnWorkflowStates(where: $where, limit: $limit) {
            data ${WORKFLOW_STATE_FIELDS}
            error {
                message
                code
                data
            }
        }
    }
`;

export interface IListRequestedWorkflowStatesVariables {
    where: IListWidgetWorkflowStatesParamsWhere;
}

export interface IListRequestedWorkflowStatesResponse {
    data: {
        listRequestedWorkflowStates: {
            data: IWorkflowStatesWidgetItem[] | null;
            meta: IWorkflowStatesWidgetMeta | null;
            error: IWorkflowStatesWidgetError | null
        }
    };
}


export const LIST_REQUESTED_WORKFLOW_STATES = gql`
    query ListRequestedWorkflowStates($where: ListWidgetWorkflowStatesWhereInput!, $limit: Int) {
        listRequestedWorkflowStates(where: $where, limit: $limit) {
            data ${WORKFLOW_STATE_FIELDS}
            error {
                message
                code
                data
            }
        }
    }
`;
