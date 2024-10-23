import { createEventHandler } from "~/index";
import { PluginsContainer } from "@webiny/plugins";
import { marshall as baseMarshall } from "@webiny/aws-sdk/client-dynamodb";
import { DynamoDBRecord } from "@webiny/handler-aws/types";

interface Event {
    Records: DynamoDBRecord[];
}

const marshall = (item: Record<string, any>): any => {
    return baseMarshall(item, {
        convertEmptyValues: true,
        removeUndefinedValues: true
    });
};

const event: Event = {
    Records: [
        {
            eventID: "123",
            dynamodb: {
                Keys: marshall({
                    PK: "s1",
                    SK: "s2"
                }),
                OldImage: marshall({
                    data: {
                        id: {
                            S: "1"
                        },
                        title: {
                            S: "T"
                        }
                    }
                }),
                NewImage: marshall({
                    data: {
                        id: {
                            S: "123"
                        },
                        title: {
                            S: "Test"
                        }
                    }
                })
            }
        }
    ]
};

const lambdaContext: any = {};
const request: any = {};
const reply: any = {};
const context: any = {
    plugins: new PluginsContainer(),
    elasticsearch: {
        bulk: async () => {
            return {
                test: true
            };
        }
    }
};

describe("event", () => {
    it("should trigger event with no records", async () => {
        const eventHandler = createEventHandler();

        const result = await eventHandler.cb({
            context,
            event: {
                Records: []
            },
            lambdaContext,
            request,
            reply,
            next: jest.fn()
        });

        expect(result).toEqual(null);
    });
    it("should trigger event with a record", async () => {
        const eventHandler = createEventHandler();

        const result = await eventHandler.cb({
            context,
            event,
            lambdaContext,
            request,
            reply,
            next: jest.fn()
        });

        expect(result).toEqual(null);
    });

    it("should just skip because of no elasticsearch", async () => {
        const eventHandler = createEventHandler();

        const result = await eventHandler.cb({
            context: {
                ...context,
                elasticsearch: undefined
            },
            event,
            lambdaContext,
            request,
            reply,
            next: jest.fn()
        });

        expect(result).toEqual(null);
    });
});
