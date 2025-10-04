import type { GenericRecord } from "@webiny/api/types.js";
import type { ICreateWorkflowInput, IUpdateWorkflowInput, IWorkflow } from "~/types.js";

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

export const GET_WORKFLOW_QUERY = /* GraphQL */ `
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

export const LIST_WORKFLOWS_QUERY = /* GraphQL */ `
    query ListWorkflows($app: String!) {
        workflows {
            listWorkflows(app: $app) {
                data ${WORKFLOW}
                ${ERROR_FIELD}
            }
        }
    }
`;

export interface ICreateWorkflowVariables {
    app: string;
    data: ICreateWorkflowInput;
}

export interface ICreateWorkflowResponse {
    data: {
        workflows: {
            createWorkflow: {
                data: IWorkflow | null;
                error: IWorkflowError | null;
            };
        };
    };
}

export const CREATE_WORKFLOW_MUTATION = /* GraphQL */ `
    mutation CreateWorkflow($app: String!, $data: CreateWorkflowInput!) {
        workflows {
            createWorkflow(app: $app, data: $data) {
                data ${WORKFLOW}
                ${ERROR_FIELD}
            }
        }
    }
`;

export interface IUpdateWorkflowVariables {
    app: string;
    id: string;
    data: IUpdateWorkflowInput;
}

export interface IUpdateWorkflowResponse {
    data: {
        workflows: {
            createWorkflow: {
                data: IWorkflow | null;
                error: IWorkflowError | null;
            };
        };
    };
}

export const UPDATE_WORKFLOW_MUTATION = /* GraphQL */ `
    mutation UpdateWorkflow($app: String!, $id: ID!, $data: UpdateWorkflowInput!) {
        workflows {
            updateWorkflow(app: $app, id: $id, data: $data) {
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
    data: {
        workflows: {
            deleteWorkflow: {
                data: boolean | null;
                error: IWorkflowError | null;
            };
        };
    };
}

export const DELETE_WORKFLOW_MUTATION = /* GraphQL */ `
    mutation DeleteWorkflow($app: String!, $id: ID!) {
        workflows {
            deleteWorkflow(app: $app, id: $id) {
                data
                ${ERROR_FIELD}
            }
        }
    }
`;
