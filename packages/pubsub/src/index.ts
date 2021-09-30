import { Subscriber, Topic } from "./types";

export const createTopic = <TEvent = any>(topicName = undefined): Topic<TEvent> => {
    const subscribers = [];

    return {
        getTopicName() {
            return topicName || "unknown";
        },
        subscribe<TEvent>(cb: Subscriber<TEvent>) {
            subscribers.push(cb);
        },
        getSubscribers() {
            return subscribers;
        },
        async publish(event) {
            for (const cb of subscribers) {
                await cb(event);
            }
            return event;
        }
    };
};
