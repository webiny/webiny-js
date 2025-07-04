export interface IWorkerActionHandleParams<T> {
    data: T;
}

export interface IWorkerAction<T = unknown> {
    name: string;
    parse(input: unknown): T | undefined;
    handle(params: IWorkerActionHandleParams<T>): Promise<void>;
}

export interface IActionHandlerHandleParams<T = unknown> {
    data: T;
}

export interface IActionHandler {
    handle<T>(params: IActionHandlerHandleParams<T>): Promise<void>;
}
