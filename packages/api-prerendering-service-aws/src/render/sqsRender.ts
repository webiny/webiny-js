import { SQSEvent } from "aws-lambda";
import plugin, { RenderParams } from "@webiny/api-prerendering-service/render";
import { createPayloadEventHandler } from "@webiny/handler-fastify-aws";

export default (params: RenderParams) => {
    const render = plugin(params);

    return createPayloadEventHandler<SQSEvent>(async ({ payload, context }) => {
        const events = payload.Records.map(r => JSON.parse(r.body));

        return render.handle(
            {
                ...context,
                invocationArgs: events
            },
            async () => void 0
        );
    });
};
