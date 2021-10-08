export interface Subscriber<TEvent> {
    (event: TEvent): void | Promise<void>;
}

export type Event = Record<string, any>;

export interface Topic<TEvent = Event> {
    getTopicName(): string;

    subscribe(cb: (event: TEvent) => void | Promise<void>): void;

    getSubscribers(): Subscriber<TEvent>[];

    publish(event?: TEvent): Promise<any>;
}
