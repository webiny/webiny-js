export interface ICopyUserActionEventData {
    userPoolId: string;
    region: string;
}

export interface ICopyUserActionEvent {
    username: string;
    action: "copyUser";
    source: ICopyUserActionEventData;
    target: ICopyUserActionEventData;
}
