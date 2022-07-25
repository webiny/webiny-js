import { RoutePlugin } from "@webiny/fastify";
import { FastifyContext } from "@webiny/fastify/types";

/**
 * We return raw data to the output of the event.
 * If we used fastify reply it would need to be stringifyable.
 */
interface EventPluginCallable<Payload, Response> {
    (payload: Payload, context: FastifyContext): Promise<Response>;
}

export class EventPlugin<Payload = Record<string, any>, Response = any> extends RoutePlugin {
    public constructor(cb: EventPluginCallable<Payload, Response>) {
        super(async ({ onPost, context }) => {
            onPost("/webiny-event", async request => {
                /**
                 * We need to send result to the instance of the fastify so it can be accessible later on when returning the response.
                 */
                let result: any;
                try {
                    result = await cb(request.body as any, context);
                } catch (ex) {
                    result = ex;
                }
                (context.server as any).__webiny_event_result = result;
                /**
                 * We must send something because request runs indefinitely otherwise...
                 */
                return {};
            });
        });
    }
}
