import { createAbstraction } from "@webiny/feature/api";
import type { Timer } from "~/api/abstractions/Timer.js";
import type { ITaskManagerStore } from "~/api/runner/abstractions/TaskManagerStore.js";
import type { ITaskRunner } from "~/api/runner/abstractions/TaskRunner.js";
import type { ITaskResponse } from "~/api/response/abstractions/index.js";

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
    readonly timer: Timer.Interface;
    readonly response: ITaskResponse;

    // Setters - called by TaskControl
    setStore(store: ITaskManagerStore): void;
    setRunner(runner: ITaskRunner): void;
    setTimer(timer: Timer.Interface): void;
    setResponse(response: ITaskResponse): void;

    // Clear after execution
    clear(): void;
}

export const TaskExecutionContext =
    createAbstraction<ITaskExecutionContext>("TaskExecutionContext");

export namespace TaskExecutionContext {
    export type Interface = ITaskExecutionContext;
}
