import { EventBridgeEvent } from "aws-lambda";
import { RenderEvent } from "@webiny/api-prerendering-service/types";
import plugin, { Params } from "@webiny/api-prerendering-service/flush";
import { createPayloadEventHandler } from "@webiny/handler-fastify-aws";

export default (params: Params) => {
    const flush = plugin(params);

    return createPayloadEventHandler<EventBridgeEvent<"FlushPages", RenderEvent | RenderEvent[]>>(
        async ({ payload, context }) => {
            if (payload["detail-type"] !== "FlushPages") {
                return;
            }

            return flush.handle(
                {
                    ...context,
                    invocationArgs: payload.detail
                },
                async () => void 0
            );
        }
    );
};
