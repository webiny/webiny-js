import type { SQSEvent } from "aws-lambda";
import { registry } from "~/registry";
import { createHandler, HandlerParams } from "./index";
import { createSourceHandler } from "~/sourceHandler";

const handler = createSourceHandler<SQSEvent, HandlerParams>({
    name: "handler-aws-sqs",
    canUse: event => {
        if (!Array.isArray(event.Records) || event.Records.length === 0) {
            return false;
        }
        const [record] = event.Records;
        if (typeof record.eventSource !== "string") {
            return false;
        }
        return record.eventSource.toLowerCase() === "aws:sqs";
    },
    handle: async ({ params, event, context }) => {
        return createHandler(params)(event, context);
    }
});

registry.register(handler);
