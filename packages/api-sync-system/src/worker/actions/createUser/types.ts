export interface ICreateUserActionEventData {
    userPoolId: string;
    region: string;
}

export interface ICreateUserActionEvent {
    username: string;
    action: "createUser";
    source: ICreateUserActionEventData;
    target: ICreateUserActionEventData;
}
