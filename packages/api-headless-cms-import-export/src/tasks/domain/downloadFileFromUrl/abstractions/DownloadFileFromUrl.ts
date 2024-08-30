export interface IDownloadFileFromUrlProcessOnIterationCallableParams<T> {
    iteration: number;
    next: number;
    stop: (status: T) => void;
}
export interface IDownloadFileFromUrlProcessOnIterationCallable<T> {
    (params: IDownloadFileFromUrlProcessOnIterationCallableParams<T>): Promise<void>;
}

export type IDownloadFileFromUrlProcessResponseType<T extends string> = T | "done";

export interface IDownloadFileFromUrl {
    process<T extends string>(
        onIteration: IDownloadFileFromUrlProcessOnIterationCallable<T>
    ): Promise<IDownloadFileFromUrlProcessResponseType<T>>;
    abort(): Promise<void>;
    getNext(): number;
    isDone(): boolean;
}
