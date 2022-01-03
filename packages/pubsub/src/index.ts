import { Subscriber, Topic } from "~/types";

export const createTopic = <TEvent = any>(topicName?: string): Topic<TEvent> => {
    const subscribers: Subscriber<TEvent>[] = [];

    const withUnsubscribe = (cb: Subscriber<TEvent>) => {
        const once = async event => {
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
            subscribers.push(cb);
        },
        subscribeOnce(cb) {
            subscribers.push(withUnsubscribe(cb));
        },
        getSubscribers() {
            return subscribers;
        },
        async publish(event) {
            for (const cb of subscribers) {
                await cb(event);
            }
        }
    };
};
