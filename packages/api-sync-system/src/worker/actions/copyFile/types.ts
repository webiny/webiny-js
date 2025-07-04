export interface ICopyFileActionEventData {
    bucket: string;
    region: string;
}

export interface ICopyFileActionEvent {
    key: string;
    action: "copy";
    source: ICopyFileActionEventData;
    target: ICopyFileActionEventData;
}
