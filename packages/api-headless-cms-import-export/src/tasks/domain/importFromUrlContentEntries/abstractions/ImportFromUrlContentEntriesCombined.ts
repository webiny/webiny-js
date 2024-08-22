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

export interface IImportFromUrlContentEntriesCombined {
    process<T extends string>(
        onIteration: IImportFromUrlContentEntriesCombinedProcessOnIterationCallable<T>
    ): Promise<T | null>;
    abort(): Promise<void>;
    getNext(): number;
    isDone(): boolean;
}
