import { createAbstraction } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { ITask, ITaskCreateData, ITaskUpdateData } from "~/api/types.js";

// ============================================================================
// TaskBeforeCreate Event
// ============================================================================

export interface TaskBeforeCreatePayload {
    input: ITaskCreateData;
}

export const TaskBeforeCreateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<TaskBeforeCreatePayload>>
>("TaskBeforeCreateEventHandler");

export namespace TaskBeforeCreateEventHandler {
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

export const TaskAfterCreateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<TaskAfterCreatePayload>>
>("TaskAfterCreateEventHandler");

export namespace TaskAfterCreateEventHandler {
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

export const TaskBeforeUpdateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<TaskBeforeUpdatePayload>>
>("TaskBeforeUpdateEventHandler");

export namespace TaskBeforeUpdateEventHandler {
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

export const TaskAfterUpdateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<TaskAfterUpdatePayload>>
>("TaskAfterUpdateEventHandler");

export namespace TaskAfterUpdateEventHandler {
    export type Interface = IEventHandler<DomainEvent<TaskAfterUpdatePayload>>;
    export type Event = DomainEvent<TaskAfterUpdatePayload>;
}

// ============================================================================
// TaskBeforeDelete Event
// ============================================================================

export interface TaskBeforeDeletePayload {
    task: ITask;
}

export const TaskBeforeDeleteEventHandler = createAbstraction<
    IEventHandler<DomainEvent<TaskBeforeDeletePayload>>
>("TaskBeforeDeleteEventHandler");

export namespace TaskBeforeDeleteEventHandler {
    export type Interface = IEventHandler<DomainEvent<TaskBeforeDeletePayload>>;
    export type Event = DomainEvent<TaskBeforeDeletePayload>;
}

// ============================================================================
// TaskAfterDelete Event
// ============================================================================

export interface TaskAfterDeletePayload {
    task: ITask;
}

export const TaskAfterDeleteEventHandler = createAbstraction<
    IEventHandler<DomainEvent<TaskAfterDeletePayload>>
>("TaskAfterDeleteEventHandler");

export namespace TaskAfterDeleteEventHandler {
    export type Interface = IEventHandler<DomainEvent<TaskAfterDeletePayload>>;
    export type Event = DomainEvent<TaskAfterDeletePayload>;
}
