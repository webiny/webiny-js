import type { IScheduledAction, ScheduledActionType } from "~/shared/abstractions.js";
import {ListScheduledActionsUseCase} from "~/features/ListScheduledActions/index.js";

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

export interface IScheduleActionMutationResponse {
    scheduler: {
        scheduleAction: {
            data: IScheduledAction | null;
            error: IErrorResponse | null;
        };
    };
}

export const SCHEDULE_ACTION = /* GraphQL */ `
    mutation ScheduleAction($namespace: String!, $id: ID!, $scheduleFor: DateTime!, $actionType: ScheduleRecordType!) {
        scheduler {
            scheduleAction(
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

export interface ICancelScheduledActionMutationVariables {
    namespace: string;
    id: string;
}

export interface ICancelScheduledActionMutationResponse {
    scheduler: {
        cancelScheduledAction: {
            data: boolean | null;
            error: IErrorResponse | null;
        };
    };
}

export const CANCEL_SCHEDULED_ACTION = /* GraphQL */ `
    mutation CancelScheduledAction($namespace: String!, $id: ID!) {
        scheduler {
            cancelScheduledAction(namespace: $namespace, id: $id) {
                data
                ${ERROR}
            }
        }
    }
`;


export interface IListScheduledActionsQueryVariables {
    namespace: string;
    where?: ListScheduledActionsUseCase.Where;
    sort?: ListScheduledActionsUseCase.Sort;
    limit?: number;
    after?: string;
}

export interface IListScheduledActionsQueryResponse {
    scheduler: {
        listScheduledActions: {
            data: IScheduledAction[] | null;
            meta: ListScheduledActionsUseCase.Meta | null;
            error: IErrorResponse | null;
        };
    };
}


export const LIST_SCHEDULED_ACTION = /* GraphQL */ `
    query ListScheduledActions(
        $namespace: String!
        $where: ListScheduledActionsWhereInput
        $sort: [ListScheduledActionsSorter!]
        $limit: Int
        $after: String
    ) {
        scheduler {
            listScheduledActions(
                namespace: $namespace
                where: $where
                sort: $sort
                limit: $limit
                after: $after
            ) {
                ${DATA}
                ${ERROR}
                meta {
                    totalCount
                    hasMoreItems
                    cursor
                }
            }
        }
    }
`;
