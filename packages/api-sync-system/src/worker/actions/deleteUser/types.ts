export interface IDeleteUserActionEventData {
    userPoolId: string;
    region: string;
}

export interface IDeleteUserActionEvent {
    username: string;
    action: "deleteUser";
    target: IDeleteUserActionEventData;
}
