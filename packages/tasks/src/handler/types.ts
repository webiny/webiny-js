export interface IIncomingEvent<TEvent> {
    name: string;
    payload: TEvent;
}

export interface ITaskEventInput {
    tenant: string;
    locale: string;
    webinyTaskId: string;
    webinyTaskDefinitionId: string;
}

export interface ITaskEvent {
    tenant: string;
    locale: string;
    endpoint: string;
    webinyTaskId: string;
    webinyTaskDefinitionId: string;
    executionName: string;
    stateMachineId: string;
}
