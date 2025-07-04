export interface ICopyFileActionEventData {
    bucket: string;
    region: string;
}

export interface ICopyFileActionEvent {
    key: string;
    action: "copyFile";
    source: ICopyFileActionEventData;
    target: ICopyFileActionEventData;
}
