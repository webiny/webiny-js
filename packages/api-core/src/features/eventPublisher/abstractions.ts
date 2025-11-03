import { Abstraction } from "@webiny/di";

export abstract class DomainEvent<TPayload = void> {
    public abstract readonly eventType: string;
    public readonly occurredAt: Date;
    public readonly payload: TPayload extends void ? undefined : TPayload;

    constructor(payload: TPayload);
    constructor(payload?: never) {
        this.occurredAt = new Date();

        if (payload === undefined) {
            this.payload = undefined as any;
        } else {
            this.payload = payload;
        }
    }

    abstract getHandlerAbstraction(): Abstraction<IEventHandler<any>>;
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
