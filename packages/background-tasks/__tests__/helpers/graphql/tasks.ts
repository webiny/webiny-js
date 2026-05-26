import type { GenericRecord } from "@webiny/api/types.js";

const FIELDS = `
    id
    definitionId
    name
    taskStatus
    createdOn
    savedOn
    eventResponse
    createdBy {
        id
        displayName
        type
    }
    startedOn
    finishedOn
    input
    logs {
        id
        createdOn
        createdBy {
            id
            displayName
            type
        }
        executionName
        iteration
        items {
            message
            createdOn
            type
            data
            error
        }
    }
`;

export interface ITaskCreatedBy {
    id: string;
    displayName: string;
    type: string;
}

export interface ITaskFieldsLogItem {
    message: string;
    createdOn: string;
    type: string;
    data: any;
    error: any;
}

export interface ITaskFieldsLog {
    id: string;
    createdOn: string;
    createdBy: ITaskCreatedBy;
    executionName: string;
    iteration: number;
    items: ITaskFieldsLogItem[];
}

export interface ITaskFields {
    id: string;
    definitionId: string;
    name: string;
    taskStatus: string;
    createdOn: string;
    savedOn: string;
    eventResponse: any;
    createdBy: ITaskCreatedBy;
    startedOn: string | null;
    finishedOn: string | null;
    input: GenericRecord;
    logs: ITaskFieldsLog[];
}

export interface ITaskError {
    message: string;
    code: string;
    data: GenericRecord;
    stack: any;
}

export const createListTasksQuery = () => {
    return /* GraphQL */ `
        query ListTasks(
            $where: WebinyBackgroundTaskListWhereInput
            $sort: [WebinyBackgroundTaskListSorter!]
            $limit: Int
            $after: String
        ) {
            backgroundTasks {
                listTasks(where: $where, sort: $sort, limit: $limit, after: $after) {
                    data {
                        ${FIELDS}
                    }
                    meta {
                        cursor
                        hasMoreItems
                        totalCount
                    }
                    error {
                        message
                        code
                        data
                    }
                }
            }
        }
    `;
};

export interface ITriggerTaskVariables {
    definition: string;
    input?: GenericRecord;
    name?: string;
    delay?: number;
}

export interface ITriggerTaskResponse {
    data: {
        backgroundTasks: {
            triggerTask: {
                data: ITaskFields | null;
                error: ITaskError | null;
            };
        };
    };
}

export const createTriggerTaskMutation = () => {
    return /* GraphQL */ `
        mutation TriggerTask($definition: String!, $input: JSON, $name: String, $delay: Number) {
            backgroundTasks {
                triggerTask(definition: $definition, input: $input, name: $name, delay: $delay) {
                    data {
                        ${FIELDS}
                    }
                    error {
                        message
                        code
                        data
                    }
                }
            }
        }
    `;
};

export interface IAbortTaskVariables {
    id: string;
}

export interface IAbortTaskResponse {
    data: {
        backgroundTasks: {
            abortTask: {
                data: ITaskFields | null;
                error: ITaskError | null;
            };
        };
    };
}

export const createAbortTaskMutation = () => {
    return /* GraphQL */ `
        mutation AbortTask($id: ID!) {
            backgroundTasks {
                abortTask(id: $id) {
                    data {
                        ${FIELDS}
                    }
                    error {
                        message
                        code
                        data
                    }
                }
            }
        }
    `;
};

export interface IGetTaskVariables {
    id: string;
}

export interface IGetTaskResponse {
    data: {
        backgroundTasks: {
            getTask: {
                data: ITaskFields | null;
                error: ITaskError | null;
            };
        };
    };
}

export const createGetTaskQuery = () => {
    return /* GraphQL */ `
        query GetTask($id: ID!) {
            backgroundTasks {
                getTask(id: $id) {
                    data {
                        ${FIELDS}
                    }
                    error {
                        message
                        code
                        data
                    }
                }
            }
        }
    `;
};
