export interface IDownloadFileRange {
    start: number;
    end: number;
}

export interface IDownloadFileFromUrlProcessOnIterationCallableParams<T> {
    iteration: number;
    next: number;
    stop: (status: T) => void;
    segment: IDownloadFileRange;
}
export interface IDownloadFileFromUrlProcessOnIterationCallable<T> {
    (params: IDownloadFileFromUrlProcessOnIterationCallableParams<T>): Promise<void>;
}

export type IDownloadFileFromUrlProcessResponseType<T extends string> = T | "done";

export interface IDownloadFileFromUrl {
    process<T extends string>(
        onIteration: IDownloadFileFromUrlProcessOnIterationCallable<T>
    ): Promise<IDownloadFileFromUrlProcessResponseType<T>>;
    getNextRange(): number;
    isDone(): boolean;
}
