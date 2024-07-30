export interface IImportFromUrlContentEntriesCombinedProcessOnIterationCallableParams {
    iteration: number;
    next: number;
    stop: (status: string | number) => void;
}
export interface IImportFromUrlContentEntriesCombinedProcessOnIterationCallable {
    (params: IImportFromUrlContentEntriesCombinedProcessOnIterationCallableParams): Promise<void>;
}

export type ImportFromUrlContentEntriesCombinedProcessStatus = string;

export interface IImportFromUrlContentEntriesCombined {
    process(
        onIteration: IImportFromUrlContentEntriesCombinedProcessOnIterationCallable
    ): Promise<ImportFromUrlContentEntriesCombinedProcessStatus>;
    abort(): Promise<void>;
    getNext(): number;
    isDone(): boolean;
}
