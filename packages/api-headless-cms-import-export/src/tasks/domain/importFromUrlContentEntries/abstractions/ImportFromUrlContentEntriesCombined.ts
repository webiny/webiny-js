export interface IImportFromUrlContentEntriesCombinedProcessOnIterationCallableParams<T> {
    iteration: number;
    next: number;
    stop: (status: T) => void;
}
export interface IImportFromUrlContentEntriesCombinedProcessOnIterationCallable<T> {
    (
        params: IImportFromUrlContentEntriesCombinedProcessOnIterationCallableParams<T>
    ): Promise<void>;
}

export type IImportFromUrlContentEntriesCombinedProcessResponseType<T extends string> = T | "done";

export interface IImportFromUrlContentEntriesCombined {
    process<T extends string>(
        onIteration: IImportFromUrlContentEntriesCombinedProcessOnIterationCallable<T>
    ): Promise<IImportFromUrlContentEntriesCombinedProcessResponseType<T>>;
    abort(): Promise<void>;
    getNext(): number;
    isDone(): boolean;
}
