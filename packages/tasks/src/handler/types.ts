export interface IIncomingEvent<TEvent> {
    name: string;
    payload: TEvent;
}

export interface ITaskEvent {
    tenant: string;
    locale: string;
    endpoint: string;
    webinyTaskId: string;
    stateMachineId: string;
}
