import { createAbstraction } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { ITask, ITaskCreateData, ITaskUpdateData } from "~/types.js";

// ============================================================================
// TaskBeforeCreate Event
// ============================================================================

export interface TaskBeforeCreatePayload {
    input: ITaskCreateData;
}

export const TaskBeforeCreateHandler =
    createAbstraction<IEventHandler<DomainEvent<TaskBeforeCreatePayload>>>(
        "TaskBeforeCreateHandler"
    );

export namespace TaskBeforeCreateHandler {
    export type Interface = IEventHandler<DomainEvent<TaskBeforeCreatePayload>>;
    export type Event = DomainEvent<TaskBeforeCreatePayload>;
}

// ============================================================================
// TaskAfterCreate Event
// ============================================================================

export interface TaskAfterCreatePayload {
    input: ITaskCreateData;
    task: ITask;
}

export const TaskAfterCreateHandler =
    createAbstraction<IEventHandler<DomainEvent<TaskAfterCreatePayload>>>("TaskAfterCreateHandler");

export namespace TaskAfterCreateHandler {
    export type Interface = IEventHandler<DomainEvent<TaskAfterCreatePayload>>;
    export type Event = DomainEvent<TaskAfterCreatePayload>;
}

// ============================================================================
// TaskBeforeUpdate Event
// ============================================================================

export interface TaskBeforeUpdatePayload {
    input: ITaskUpdateData;
    original: ITask;
}

export const TaskBeforeUpdateHandler =
    createAbstraction<IEventHandler<DomainEvent<TaskBeforeUpdatePayload>>>(
        "TaskBeforeUpdateHandler"
    );

export namespace TaskBeforeUpdateHandler {
    export type Interface = IEventHandler<DomainEvent<TaskBeforeUpdatePayload>>;
    export type Event = DomainEvent<TaskBeforeUpdatePayload>;
}

// ============================================================================
// TaskAfterUpdate Event
// ============================================================================

export interface TaskAfterUpdatePayload {
    input: ITaskUpdateData;
    task: ITask;
}

export const TaskAfterUpdateHandler =
    createAbstraction<IEventHandler<DomainEvent<TaskAfterUpdatePayload>>>("TaskAfterUpdateHandler");

export namespace TaskAfterUpdateHandler {
    export type Interface = IEventHandler<DomainEvent<TaskAfterUpdatePayload>>;
    export type Event = DomainEvent<TaskAfterUpdatePayload>;
}

// ============================================================================
// TaskBeforeDelete Event
// ============================================================================

export interface TaskBeforeDeletePayload {
    task: ITask;
}

export const TaskBeforeDeleteHandler =
    createAbstraction<IEventHandler<DomainEvent<TaskBeforeDeletePayload>>>(
        "TaskBeforeDeleteHandler"
    );

export namespace TaskBeforeDeleteHandler {
    export type Interface = IEventHandler<DomainEvent<TaskBeforeDeletePayload>>;
    export type Event = DomainEvent<TaskBeforeDeletePayload>;
}

// ============================================================================
// TaskAfterDelete Event
// ============================================================================

export interface TaskAfterDeletePayload {
    task: ITask;
}

export const TaskAfterDeleteHandler =
    createAbstraction<IEventHandler<DomainEvent<TaskAfterDeletePayload>>>("TaskAfterDeleteHandler");

export namespace TaskAfterDeleteHandler {
    export type Interface = IEventHandler<DomainEvent<TaskAfterDeletePayload>>;
    export type Event = DomainEvent<TaskAfterDeletePayload>;
}
