import type { S3Event } from "aws-lambda";
import { registry } from "~/registry";
import { HandlerFactoryParams } from "~/types";
import { createSourceHandler } from "~/sourceHandler";
import { createHandler } from "./index";

export interface HandlerParams extends HandlerFactoryParams {
    debug?: boolean;
}

const handler = createSourceHandler<S3Event, HandlerParams>({
    name: "handler-aws-s3",
    canUse: event => {
        if (!Array.isArray(event.Records) || event.Records.length === 0) {
            return false;
        }
        const [record] = event.Records;
        return !!record.s3;
    },
    handle: async ({ params, event, context }) => {
        return createHandler(params)(event, context);
    }
});

registry.register(handler);
