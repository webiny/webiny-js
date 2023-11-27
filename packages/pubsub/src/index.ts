import { Event, Subscriber, Topic } from "~/types";

export const createTopic = <TEvent extends Event = Event>(topicName?: string): Topic<TEvent> => {
    const subscribers: Subscriber<TEvent>[] = [];

    const withUnsubscribe = (cb: Subscriber<TEvent>) => {
        const once = async (event: TEvent) => {
            await cb(event);
            const index = subscribers.findIndex(fn => fn === once);
            if (index > -1) {
                subscribers.splice(index, 1);
            }
        };

        return once;
    };

    return {
        getTopicName() {
            return topicName || "unknown";
        },
        subscribe(cb) {
            /**
             * TODO @ts-refactor figure out types for callback
             */
            // @ts-expect-error
            subscribers.push(cb);
        },
        subscribeOnce(cb) {
            /**
             * TODO @ts-refactor figure out types for callback
             */
            // @ts-expect-error
            subscribers.push(withUnsubscribe(cb));
        },
        getSubscribers(): Subscriber<TEvent>[] {
            return subscribers;
        },
        async publish(event: TEvent) {
            for (const cb of subscribers) {
                await cb(event);
            }
        }
    };
};
