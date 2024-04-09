import { registry } from "~/registry";
import type { DynamoDBStreamEvent } from "aws-lambda";
import { createSourceHandler } from "~/sourceHandler";
import { createHandler, HandlerParams } from "~/dynamodb/index";

const handler = createSourceHandler<DynamoDBStreamEvent, HandlerParams>({
    name: "handler-aws-dynamodb-stream",
    canUse: event => {
        if (!Array.isArray(event.Records) || event.Records.length === 0) {
            return false;
        }
        const [record] = event.Records;
        if (typeof record.eventSource !== "string") {
            return false;
        }
        return record.eventSource.toLowerCase() === "aws:dynamodb";
    },
    handle: async ({ params, event, context }) => {
        return createHandler(params)(event, context);
    }
});

registry.register(handler);
