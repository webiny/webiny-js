import type { SNSEvent } from "aws-lambda";
import { registry } from "~/registry";
import { createHandler, HandlerParams } from "./index";
import { createSourceHandler } from "~/sourceHandler";

const handler = createSourceHandler<SNSEvent, HandlerParams>({
    name: "handler-aws-sns",
    canUse: event => {
        if (!Array.isArray(event.Records) || event.Records.length === 0) {
            return false;
        }
        const [record] = event.Records;
        return !!record.Sns;
    },
    handle: async ({ params, event, context }) => {
        return createHandler(params)(event, context);
    }
});

registry.register(handler);
