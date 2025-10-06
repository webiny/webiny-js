import type { GenericRecord, NonEmptyArray } from "@webiny/app/types.js";
import type { IWorkflow } from "~/types.js";
import gql from "graphql-tag";

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

export interface IWorkflowError {
    code: string;
    message: string;
    data?: GenericRecord;
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
    data: {
        workflows: {
            updateWorkflow: {
                data: IWorkflow | null;
                error: IWorkflowError | null;
            };
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


export interface IGetWorkflowVariables {
    app: string;
    id: string;
}

export interface IGetWorkflowResponse {
    data: {
        workflows: {
            getWorkflow: {
                data: IWorkflow | null;
                error: IWorkflowError | null;
            };
        };
    };
}

export const GET_WORKFLOW_QUERY = gql`
    query GetWorkflow($app: String!, $id: ID!) {
        workflows {
            getWorkflow(app: $app, id: $id) {
                data ${WORKFLOW}
                ${ERROR_FIELD}
            }
        }
    }
`;

export interface IListWorkflowVariables {
    app: string;
}

export interface IListWorkflowResponse {
    data: {
        workflows: {
            listWorkflows: {
                data: IWorkflow[] | null;
                error: IWorkflowError | null;
            };
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
