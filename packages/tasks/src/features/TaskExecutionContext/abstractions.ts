import { createAbstraction } from "@webiny/feature/api";
import type { ITimer } from "@webiny/handler-aws";
import type { ITaskManagerStore } from "~/runner/abstractions/TaskManagerStore.js";
import type { ITaskRunner } from "~/runner/abstractions/TaskRunner.js";
import type { ITaskResponse } from "~/response/abstractions/index.js";

/**
 * TaskExecutionContext holds runtime state for the currently executing task.
 * Properties are set by TaskRunner before task execution.
 *
 * This is registered as a singleton in the DI container with empty values,
 * then populated at runtime by TaskControl before executing each task.
 */
export interface ITaskExecutionContext {
    // Getters - may throw if not set
    readonly store: ITaskManagerStore;
    readonly runner: ITaskRunner;
    readonly timer: ITimer;
    readonly response: ITaskResponse;

    // Setters - called by TaskControl
    setStore(store: ITaskManagerStore): void;
    setRunner(runner: ITaskRunner): void;
    setTimer(timer: ITimer): void;
    setResponse(response: ITaskResponse): void;

    // Clear after execution
    clear(): void;
}

export const TaskExecutionContext =
    createAbstraction<ITaskExecutionContext>("TaskExecutionContext");

export namespace TaskExecutionContext {
    export type Interface = ITaskExecutionContext;
}
