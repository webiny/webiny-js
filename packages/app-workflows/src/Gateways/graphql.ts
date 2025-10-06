import type { NonEmptyArray } from "@webiny/app/types.js";
import type { IWorkflow } from "~/types.js";
import gql from "graphql-tag";
import type { IWorkflowError } from "~/Gateways/abstraction/WorkflowsGateway.js";

export interface IWorkflowStepTeamInput {
    id: string;
}

export interface IWorkflowStepNotificationInput {
    id: string;
}

export interface IWorkflowStepInput {
    id: string;
    title: string;
    color: string;
    description?: string;
    teams: NonEmptyArray<IWorkflowStepTeamInput>;
    notifications?: IWorkflowStepNotificationInput[];
}

const ERROR_FIELD = /* GraphQL */ `
    error {
        code
        message
        data
    }
`;

const WORKFLOW = /* GraphQL */ `
    {
        id
        app
        name
        steps {
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
        }
    }
`;

export interface IStoreWorkflowInput {
    name: string;
    steps: NonEmptyArray<IWorkflowStepInput>;
}

export interface IStoreWorkflowVariables {
    app: string;
    id: string;
    data: IStoreWorkflowInput;
}

export interface IStoreWorkflowResponse {
    workflows: {
        storeWorkflow: {
            data: IWorkflow | null;
            error: IWorkflowError | null;
        };
    };
}

export const STORE_WORKFLOW_MUTATION = gql`
    mutation StoreWorkflow($app: String!, $id: ID!, $data: StoreWorkflowInput!) {
        workflows {
            storeWorkflow(app: $app, id: $id, data: $data) {
                data ${WORKFLOW}
                ${ERROR_FIELD}
            }
        }
    }
`;

export interface IDeleteWorkflowVariables {
    app: string;
    id: string;
}

export interface IDeleteWorkflowResponse {
    workflows: {
        deleteWorkflow: {
            data: boolean | null;
            error: IWorkflowError | null;
        };
    };
}

export const DELETE_WORKFLOW_MUTATION = gql`
    mutation DeleteWorkflow($app: String!, $id: ID!) {
        workflows {
            deleteWorkflow(app: $app, id: $id) {
                data
                ${ERROR_FIELD}
            }
        }
    }
`;

export interface IListWorkflowVariables {
    app: string;
}

export interface IListWorkflowResponse {
    workflows: {
        listWorkflows: {
            data: IWorkflow[] | null;
            error: IWorkflowError | null;
        };
    };
}

export const LIST_WORKFLOWS_QUERY = gql`
    query ListWorkflows($app: String!) {
        workflows {
            listWorkflows(app: $app) {
                data ${WORKFLOW}
                ${ERROR_FIELD}
            }
        }
    }
`;
