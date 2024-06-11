export interface ICmsEntryZipperExecuteParams {
    shouldAbort(): boolean;
}

export interface ICmsEntryZipper {
    execute(params: ICmsEntryZipperExecuteParams): Promise<void>;
}
