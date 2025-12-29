export interface IWorkflowNotification {
    id: string;
    title: string;
}

export interface IWorkflowNotificationError {
    code: string | null;
    message: string;
    stack?: string;
}

export interface IWorkflowNotificationTypesGatewayListResponse {
    data: IWorkflowNotification[] | null;
    error: IWorkflowNotificationError | null;
}

export interface IWorkflowNotificationTypesGateway {
    list(): Promise<IWorkflowNotificationTypesGatewayListResponse>;
}
