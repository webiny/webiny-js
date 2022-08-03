import plugin, { RenderParams } from "@webiny/api-prerendering-service/render";
import { createSQSEventHandler } from "@webiny/handler-fastify-aws";
import { HandlerPayload } from "@webiny/api-prerendering-service/render/types";

export default (params: RenderParams) => {
    const render = plugin(params);

    return createSQSEventHandler(async ({ event, context, request, reply }) => {
        const events: HandlerPayload = event.Records.map(r => JSON.parse(r.body));

        return render.cb({
            context,
            payload: events,
            request,
            reply
        });
    });
};
