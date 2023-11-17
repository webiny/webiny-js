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
        const [record] = event.Records;
        if (!record.eventSource?.toLowerCase) {
            return false;
        }
        return record.eventSource.toLowerCase() === "aws:dynamodb";
    },
    handle: async ({ params, event, context }) => {
        return createHandler(params)(event, context);
    }
});

registry.register(handler);
