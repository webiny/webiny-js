import { registry } from "~/registry";
import { DynamoDBStreamEvent } from "aws-lambda";
import { createSourceHandler } from "~/sourceHandler";
import { createHandler, HandlerParams } from "~/dynamodb/index";

const handler = createSourceHandler<DynamoDBStreamEvent, HandlerParams>({
    name: "handler-aws-dynamodb-stream",
    canUse: event => {
        if (!Array.isArray(event.Records)) {
            return false;
        }
        return event.Records.some(record => {
            if (typeof record.eventSource !== "string") {
                return false;
            }
            return record.eventSource.toLowerCase() === "aws:dynamodb";
        });
    },
    handle: async ({ params, event, context }) => {
        return createHandler(params)(event, context);
    }
});

registry.register(handler);
