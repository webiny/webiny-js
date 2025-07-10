export interface IDeleteFileActionEventData {
    bucket: string;
    region: string;
}

export interface IDeleteFileActionEvent {
    key: string;
    action: "deleteFile";
    target: IDeleteFileActionEventData;
}
