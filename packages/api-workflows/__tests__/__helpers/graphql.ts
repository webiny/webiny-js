import type { GenericRecord } from "@webiny/api/types.js";
import type {
    IStoreWorkflowInput,
    IWorkflowsContextListParams
} from "~/context/abstractions/WorkflowsContext.js";
import type { IMeta } from "~/context/abstractions/types.js";
import type { IWorkflow } from "~/context/abstractions/Workflow.js";

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

export type IListWorkflowVariables = IWorkflowsContextListParams;

export interface IListWorkflowResponse {
    data: {
        workflows: {
            listWorkflows: {
                data: IWorkflow[] | null;
                meta: IMeta | null;
                error: IWorkflowError | null;
            };
        };
    };
}

export const LIST_WORKFLOWS_QUERY = /* GraphQL */ `
    query ListWorkflows($where: ListWorkflowsWhereInput, $limit: Number, $sort: [ListWorkflowsSort!], $after: String) {
        workflows {
            listWorkflows(where: $where, limit: $limit, sort: $sort, after: $after) {
                data ${WORKFLOW}
                meta {
                    cursor
                    hasMoreItems
                    totalCount
                }
                ${ERROR_FIELD}
            }
        }
    }
`;
export interface IStoreWorkflowVariables {
    app: string;
    id: string;
    data: IStoreWorkflowInput;
}

export interface IStoreWorkflowResponse {
    data: {
        workflows: {
            storeWorkflow: {
                data: IWorkflow | null;
                error: IWorkflowError | null;
            };
        };
    };
}

export const STORE_WORKFLOW_MUTATION = /* GraphQL */ `
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
