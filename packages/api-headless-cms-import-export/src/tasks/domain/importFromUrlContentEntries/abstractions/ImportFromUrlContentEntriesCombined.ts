export interface IImportFromUrlContentEntriesCombined {
    isDone(): boolean;
    process(): Promise<void>;
    abort(): Promise<void>;
}
