import { registry } from "~/registry";
import { HandlerFactoryParams } from "~/types";
import { S3Event } from "aws-lambda";
import { createSourceHandler } from "~/sourceHandler";
import { createHandler } from "./index";

export interface HandlerParams extends HandlerFactoryParams {
    debug?: boolean;
}

const handler = createSourceHandler<S3Event, HandlerParams>({
    name: "handler-aws-s3",
    canUse: event => {
        if (!Array.isArray(event.Records)) {
            return false;
        }
        return event.Records.some(record => {
            return !!record.s3;
        });
    },
    handle: async ({ params, event, context }) => {
        return createHandler(params)(event, context);
    }
});

registry.register(handler);
