import { createEventHandler } from "~/index";
import { PluginsContainer } from "@webiny/plugins";
import { DynamoDBStreamEvent } from "aws-lambda";

const event: DynamoDBStreamEvent = {
    Records: [
        {
            eventID: "123",
            dynamodb: {
                NewImage: {}
            }
        }
    ]
};

const lambdaContext: any = {};
const request: any = {};
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
            request
        });

        expect(result).toEqual(null);
    });
    it("should trigger event with a record", async () => {
        const eventHandler = createEventHandler();

        const result = await eventHandler.cb({
            context,
            event,
            lambdaContext,
            request
        });

        expect(result).toEqual(null);
    });
});
