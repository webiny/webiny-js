import gql from "graphql-tag";
import type { IWorkflowStatesWidgetItem } from "~/types.js";
import type {
    IWorkflowStatesWidgetError,
    IWorkflowStatesWidgetMeta
} from "~/Gateways/abstraction/WorkflowStatesWidgetGateway.js";

const META_FIELDS = /* GraphQL */ `
    meta {
        totalCount
        hasMoreItems
        cursor
    }
`;

const ERROR_FIELDS = /* GraphQL */ `
    error {
        code
        message
        data
        stack
    }
`;

const WORKFLOW_STATE_FIELDS = /* GraphQL */ `
    {
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
            state
            savedBy {
                id
                displayName
                type
            }
            isAllowedToReview
        }
    }
`;

export interface IListWidgetWorkflowStatesParamsWhere {
    state: string;
}

export interface IListOwnWorkflowStatesVariables {
    where: IListWidgetWorkflowStatesParamsWhere;
    limit: number;
}

export interface IListOwnWorkflowStatesResponse {
    workflows: {
        listOwnWorkflowStates: {
            data: IWorkflowStatesWidgetItem[] | null;
            meta: IWorkflowStatesWidgetMeta | null;
            error: IWorkflowStatesWidgetError | null;
        };
    };
}

export const LIST_OWN_WORKFLOW_STATES = gql`
    query ListOwnWorkflowStates($where: ListWidgetWorkflowStatesWhereInput!, $limit: Int!) {
        workflows {
            listOwnWorkflowStates(where: $where, limit: $limit) {
                data ${WORKFLOW_STATE_FIELDS}
                ${META_FIELDS}
                ${ERROR_FIELDS}
            }
        }
    }
`;

export interface IListRequestedWorkflowStatesVariables {
    where: IListWidgetWorkflowStatesParamsWhere;
    limit: number;
}

export interface IListRequestedWorkflowStatesResponse {
    workflows: {
        listRequestedWorkflowStates: {
            data: IWorkflowStatesWidgetItem[] | null;
            meta: IWorkflowStatesWidgetMeta | null;
            error: IWorkflowStatesWidgetError | null;
        };
    };
}

export const LIST_REQUESTED_WORKFLOW_STATES = gql`
    query ListRequestedWorkflowStates($where: ListWidgetWorkflowStatesWhereInput!, $limit: Int!) {
        workflows {
            listRequestedWorkflowStates(where: $where, limit: $limit) {
                data ${WORKFLOW_STATE_FIELDS}
                ${META_FIELDS}
                ${ERROR_FIELDS}
            }
        }
    }
`;
