import { RoutePlugin, RoutePluginCb } from "@webiny/fastify";
import { FastifyContext, Request, Reply } from "@webiny/fastify/types";

interface EventPluginCallableParams<P, C extends FastifyContext> {
    payload: P;
    context: C;
    request: Request;
    reply: Reply;
}
/**
 * We return raw data to the output of the event.
 * If we used fastify reply it would need to be stringifyable.
 */
export interface EventPluginCallable<P, C extends FastifyContext, R> {
    (params: EventPluginCallableParams<P, C>): Promise<R>;
}

export abstract class EventPlugin<
    Payload = any,
    Context extends FastifyContext = FastifyContext,
    Response = any
> extends RoutePlugin {
    public constructor(path: string, cb: EventPluginCallable<Payload, Context, Response>) {
        const fn: RoutePluginCb<Context> = async ({ onPost, context }) => {
            onPost(path, async (request, reply) => {
                /**
                 * We need to send result to the instance of the fastify so it can be accessible later on when returning the response.
                 */
                let result: Response;
                try {
                    result = await cb({
                        payload: request.body as Payload,
                        context,
                        request,
                        reply
                    });
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
