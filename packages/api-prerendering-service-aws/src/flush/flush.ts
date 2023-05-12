import { RenderEvent } from "@webiny/api-prerendering-service/types";
import plugin, { Params } from "@webiny/api-prerendering-service/flush";
import { createEventBridgeEventHandler } from "@webiny/handler-aws";

export default (params: Params) => {
    const flush = plugin(params);

    return createEventBridgeEventHandler<"FlushPages", RenderEvent | RenderEvent[]>(
        async params => {
            const { payload, reply } = params;
            if (payload["detail-type"] !== "FlushPages") {
                return reply.send({});
            }

            return flush.cb({
                ...params,
                payload: payload.detail
            });
        }
    );
};
