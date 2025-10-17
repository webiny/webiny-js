import { Abstraction } from "@webiny/di-container";

export interface DomainEvent<TPayload = void> {
    eventType: string;
    payload?: TPayload;
    occurredAt: Date;
    // Key: each event knows its handler abstraction
    getHandlerAbstraction(): Abstraction<IEventHandler<any>>;
}

export interface IEventHandler<TEvent extends DomainEvent<any> = DomainEvent<any>> {
    handle(event: TEvent): Promise<void>;
}

export interface IEventPublisher {
    publish<TEvent extends DomainEvent<any>>(event: TEvent): Promise<void>;
}

export const EventPublisher = new Abstraction<IEventPublisher>("EventPublisher");

export namespace EventPublisher {
    export type Interface = IEventPublisher;
}
