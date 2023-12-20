export interface IIncomingEvent<TEvent> {
    FunctionName: string;
    Payload: TEvent;
}

export interface ITaskEvent {
    tenant: string;
    locale: string;
    endpoint: string;
    webinyTaskId: string;
    stateMachineId: string;
}
