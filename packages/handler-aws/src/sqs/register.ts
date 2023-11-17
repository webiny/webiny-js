import { registry } from "~/registry";
import { SourceHandler } from "~/types";
import { SQSEvent } from "aws-lambda";
import { createHandler, HandlerParams } from "./index";

const handler: SourceHandler<SQSEvent, HandlerParams> = {
    name: "handler-aws-sqs",
    canUse: event => {
        if (!Array.isArray(event.Records) || event.Records.length === 0) {
            return false;
        }
        const [record] = event.Records;
        if (!record.eventSource?.toLowerCase) {
            return false;
        }
        return record.eventSource.toLowerCase() === "aws:sqs";
    },
    handle: async ({ params, event, context }) => {
        return createHandler(params)(event, context);
    }
};

registry.register(handler);
