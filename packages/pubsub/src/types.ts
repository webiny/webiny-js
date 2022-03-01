export interface Subscriber<TEvent> {
    (event: TEvent): void | Promise<void>;
}

export type Event = Record<string, any>;

export interface Topic<TEvent extends Event = Event> {
    getTopicName(): string;

    subscribe<TCEvent extends TEvent = TEvent>(cb: Subscriber<TCEvent>): void;

    subscribeOnce<TCEvent extends TEvent = TEvent>(cb: Subscriber<TCEvent>): void;

    getSubscribers(): Subscriber<TEvent>[];

    publish(event: TEvent): Promise<any>;
}
