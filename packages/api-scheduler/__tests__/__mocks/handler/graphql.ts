import type { IScheduledAction, ScheduledActionType } from "~/shared/abstractions.js";

export const ERROR = /* GraphQL */ `
    error {
        message
        code
        data
        stack
    }
`;

export const DATA = /* GraphQL */ `
    data {
        id
        title
        namespace
        actionType
        targetId
        scheduleFor
        payload
    }
`;

interface IErrorResponse {
    message: string;
    code?: string;
    data?: any;
    stack?: string;
}

export interface ICreateScheduledActionMutationVariables {
    namespace: string;
    id: string;
    scheduleFor: Date;
    actionType: ScheduledActionType;
}

export interface ICreateScheduledActionMutationResponse {
    scheduler: {
        createScheduledAction: {
            data: IScheduledAction | null;
            error: IErrorResponse | null;
        };
    };
}

export const CREATE_SCHEDULED_ACTION = /* GraphQL */ `
    mutation CreateScheduledAction($namespace: String!, $id: ID!, $scheduleFor: DateTime!, actionType: ScheduleRecordType!) {
        scheduler {
            createScheduledAction(
                namespace: $namespace,
                targetId: $id,
                scheduleFor: $scheduleFor,
                actionType: $actionType
            ) {
                ${DATA}
                ${ERROR}
            }
        }
    }
`;

export interface ICreateScheduledActionMutationVariables {
    namespace: string;
    id: string;
    scheduleFor: Date;
    actionType: ScheduledActionType;
}

export interface ICreateScheduledActionMutationResponse {
    scheduler: {
        createScheduledAction: {
            data: IScheduledAction | null;
            error: IErrorResponse | null;
        };
    };
}

export const UPDATE_SCHEDULED_ACTION = /* GraphQL */ `
    mutation UpdateScheduledAction($namespace: String!, $id: ID!, $scheduleFor: DateTime!, actionType: ScheduleRecordType!) {
        scheduler {
            updateScheduledAction(
                namespace: $namespace,
                targetId: $id,
                scheduleFor: $scheduleFor,
                actionType: $actionType
            ) {
                ${DATA}
                ${ERROR}
            }
        }
    }
`;
