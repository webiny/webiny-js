import { TaskExecutionContext as Abstraction } from "./abstractions.js";
import type { ITaskManagerStore } from "~/runner/abstractions/TaskManagerStore.js";
import type { ITaskRunner } from "~/runner/abstractions/TaskRunner.js";
import type { ITimer } from "@webiny/handler/timer/index.js";
import type { ITaskResponse } from "~/response/abstractions/index.js";

class TaskExecutionContextImpl implements Abstraction.Interface {
    private _store?: ITaskManagerStore;
    private _runner?: ITaskRunner;
    private _timer?: ITimer;
    private _response?: ITaskResponse;

    get store(): ITaskManagerStore {
        if (!this._store) {
            throw new Error("TaskExecutionContext: store not set. Task execution not started.");
        }
        return this._store;
    }

    get runner(): ITaskRunner {
        if (!this._runner) {
            throw new Error("TaskExecutionContext: runner not set. Task execution not started.");
        }
        return this._runner;
    }

    get timer(): ITimer {
        if (!this._timer) {
            throw new Error("TaskExecutionContext: timer not set. Task execution not started.");
        }
        return this._timer;
    }

    get response(): ITaskResponse {
        if (!this._response) {
            throw new Error("TaskExecutionContext: response not set. Task execution not started.");
        }
        return this._response;
    }

    setStore(store: ITaskManagerStore): void {
        this._store = store;
    }

    setRunner(runner: ITaskRunner): void {
        this._runner = runner;
    }

    setTimer(timer: ITimer): void {
        this._timer = timer;
    }

    setResponse(response: ITaskResponse): void {
        this._response = response;
    }

    clear(): void {
        this._store = undefined;
        this._runner = undefined;
        this._timer = undefined;
    }
}

export const TaskExecutionContext = Abstraction.createImplementation({
    implementation: TaskExecutionContextImpl,
    dependencies: []
});
