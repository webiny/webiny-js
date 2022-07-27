import { RoutePlugin, RoutePluginCb } from "@webiny/fastify";
import { FastifyContext } from "@webiny/fastify/types";

/**
 * We return raw data to the output of the event.
 * If we used fastify reply it would need to be stringifyable.
 */
interface EventPluginCallable<P, C extends FastifyContext, R> {
    (payload: P, context: C): Promise<R>;
}

export class EventPlugin<
    P,
    C extends FastifyContext = FastifyContext,
    R = any
> extends RoutePlugin {
    public constructor(cb: EventPluginCallable<P, C, R>) {
        const fn: RoutePluginCb<C> = async ({ onPost, context }) => {
            onPost("/webiny-event", async request => {
                /**
                 * We need to send result to the instance of the fastify so it can be accessible later on when returning the response.
                 */
                let result: R;
                try {
                    result = await cb(request.body as unknown as P, context);
                } catch (ex) {
                    result = ex;
                }
                (context.server as any).__webiny_event_result = result;
                /**
                 * We must send something because request runs indefinitely otherwise...
                 */
                return {};
            });
        };
        /**
         * TODO figure out how to make this work without casting as any
         */
        super(fn as any);
    }
}
