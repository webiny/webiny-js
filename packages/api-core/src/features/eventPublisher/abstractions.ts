import { Abstraction } from "@webiny/di-container";

export interface DomainEvent<TPayload = any> {
    eventType: string;
    payload: TPayload;
    occurredAt: Date;
    // Key: each event knows its handler abstraction
    getHandlerAbstraction(): Abstraction<IEventHandler<any>>;
}

export interface IEventHandler<TEvent extends DomainEvent = DomainEvent> {
    handle(event: TEvent): Promise<void>;
}

export interface IEventPublisher {
    publish<TEvent extends DomainEvent>(event: TEvent): Promise<void>;
}

export const EventPublisher = new Abstraction<IEventPublisher>("EventPublisher");

export namespace EventPublisher {
    export type Interface = IEventPublisher;
}
