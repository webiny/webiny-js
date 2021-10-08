import { Subscriber, Topic } from "~/types";

export const createTopic = <TEvent = any>(topicName?: string): Topic<TEvent> => {
    const subscribers: Subscriber<TEvent>[] = [];

    return {
        getTopicName() {
            return topicName || "unknown";
        },
        subscribe(cb: Subscriber<TEvent>) {
            subscribers.push(cb);
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
