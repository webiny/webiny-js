export interface IUpdateUserActionEventData {
    userPoolId: string;
    region: string;
}

export interface IUpdateUserActionEvent {
    username: string;
    action: "updateUser";
    source: IUpdateUserActionEventData;
    target: IUpdateUserActionEventData;
}
