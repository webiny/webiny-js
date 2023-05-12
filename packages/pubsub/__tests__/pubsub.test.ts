import { createTopic } from "../src";
import { Event } from "~/types";

interface TestEvent extends Event {
    [key: string]: number;
}

describe("pubsub", () => {
    test("create a topic, subscribe to it, and publish an event", async () => {
        const topic = createTopic<TestEvent>("pubsub.testTopic");

        const values: TestEvent[] = [];

        topic.subscribe(eventValue => {
            values.push(eventValue);
        });

        topic.subscribe(eventValue => {
            values.push(eventValue);
        });

        await topic.publish({
            value: 1
        });

        expect(values).toEqual([
            {
                value: 1
            },
            {
                value: 1
            }
        ]);
    });

    test("subscribeOnce should only handle event once", async () => {
        const topic = createTopic<TestEvent>("pubSubTest.topic");

        const values: TestEvent[] = [];

        topic.subscribeOnce(eventValue => {
            values.push(eventValue);
        });

        await topic.publish({
            value: 1
        });
        await topic.publish({
            value: 1
        });

        expect(values).toEqual([
            {
                value: 1
            }
        ]);
    });
});
