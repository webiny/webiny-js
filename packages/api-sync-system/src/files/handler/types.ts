export interface IFileHandlerEventData {
    key: string;
    bucket: string;
    region: string;
}

export interface IFileHandlerEvent {
    action: "copy" | "delete";
    source: IFileHandlerEventData;
    target: IFileHandlerEventData;
}
