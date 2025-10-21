import type { GenericRecord } from "@webiny/api/types.js";
import type {
    IStoreWorkflowInput,
    IWorkflowsContextListParams
} from "~/context/abstractions/WorkflowsContext.js";
import type { IMeta } from "~/context/abstractions/types.js";
import type { IWorkflow } from "~/context/abstractions/Workflow.js";
import type { IWorkflowStateRecord } from "~/context/abstractions/WorkflowState.js";
import type { IWorkflowStateContextListStatesParams } from "~/context/abstractions/WorkflowStateContext.js";

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

const WORKFLOW_STATE = /* GraphQL */ `
    {
        id
        createdOn
        savedOn
        savedBy {
            id
            displayName
            type
        }
        app
        workflowId
        targetId
        targetRevisionId
        comment
        state
        steps {
            id
            state
            comment
            savedBy {
                id
                displayName
                type
            }
        }
        workflow {
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
/**
 * Workflow States
 */

export interface ICreateWorkflowStateVariables {
    app: string;
    targetRevisionId: string;
}

export interface ICreateWorkflowStateResponse {
    data: {
        workflows: {
            createWorkflowState: {
                data: IWorkflowStateRecord | null;
                error: IWorkflowError | null;
            };
        };
    };
}

export const CREATE_WORKFLOW_STATE_MUTATION = /* GraphQL */ `
    mutation CreateWorkflowState($app: String!, $targetRevisionId: ID!) {
        workflows {
            createWorkflowState(app: $app, targetRevisionId: $targetRevisionId) {
                data ${WORKFLOW_STATE}
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
    data: {
        workflows: {
            getTargetWorkflowState: {
                data: IWorkflowStateRecord | null;
                error: IWorkflowError | null;
            };
        };
    };
}

export const GET_TARGET_WORKFLOW_STATE_QUERY = /* GraphQL */ `
    query GetTargetWorkflowState($app: String!, $targetRevisionId: ID!) {
        workflows {
            getTargetWorkflowState(app: $app, targetRevisionId: $targetRevisionId) {
                data ${WORKFLOW_STATE}
                ${ERROR_FIELD}
            }
        }
    }
`;

export type IListTargetWorkflowStatesVariables = IWorkflowStateContextListStatesParams;

export interface IListTargetWorkflowStatesResponse {
    data: {
        workflows: {
            listWorkflowStates: {
                data: IWorkflowStateRecord[] | null;
                meta: IMeta | null;
                error: IWorkflowError | null;
            };
        };
    };
}

export const LIST_TARGET_WORKFLOW_STATES_QUERY = /* GraphQL */ `
    query ListWorkflowStates(
        $where: ListWorkflowStatesWhereInput,
        $sort: [ListWorkflowStatesSort!],
        $limit: Number,
        $after: String
    ) {
        workflows {
            listWorkflowStates(
                where: $where,
                sort: $sort,
                limit: $limit,
                after: $after
            ) {
                data ${WORKFLOW_STATE}
                ${ERROR_FIELD}
                meta {
                    cursor
                    hasMoreItems
                    totalCount
                }
            }
        }
    }
`;

export interface IStartWorkflowStateStepVariables {
    id: string;
}

export interface IStartWorkflowStateStepResponse {
    data: {
        workflows: {
            startReviewWorkflowStateStep: {
                data: IWorkflowStateRecord | null;
                error: IWorkflowError | null;
            };
        };
    };
}

export const START_WORKFLOW_STATE_STEP_MUTATION = /* GraphQL */ `
    mutation StartWorkflowStateStep($id: ID!) {
        workflows {
            startWorkflowStateStep(id: $id) {
                data ${WORKFLOW_STATE}
                ${ERROR_FIELD}
            }
        }
    }`;

export interface IApproveWorkflowStateStepVariables {
    id: string;
    comment?: string;
}

export interface IApproveWorkflowStateStepResponse {
    data: {
        workflows: {
            approveWorkflowStateStep: {
                data: IWorkflowStateRecord | null;
                error: IWorkflowError | null;
            };
        };
    };
}

export const APPROVE_WORKFLOW_STATE_STEP_MUTATION = /* GraphQL */ `
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
    comment?: string;
}

export interface IRejectWorkflowStateStepResponse {
    data: {
        workflows: {
            rejectWorkflowStateStep: {
                data: IWorkflowStateRecord | null;
                error: IWorkflowError | null;
            };
        };
    };
}

export const REJECT_WORKFLOW_STATE_STEP_MUTATION = /* GraphQL */ `
    mutation RejectWorkflowStateStep($id: ID!, $comment: String!) {
        workflows {
            rejectWorkflowStateStep(id: $id, comment: $comment) {
                data ${WORKFLOW_STATE}
                ${ERROR_FIELD}
            }
        }
    }
`;
