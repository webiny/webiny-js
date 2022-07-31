import {
    createFastify,
    CreateFastifyHandlerParams as BaseCreateFastifyHandlerParams
} from "@webiny/fastify";
import { PayloadEventHandler, PayloadHandlerCallableParams } from "./plugins/PayloadEventHandler";
import { Context as LambdaContext } from "aws-lambda";

const url = "/webiny-payload-event";

export interface HandlerCallable<Payload, Response> {
    (payload: Payload, context: LambdaContext): Promise<Response>;
}

export interface CreateHandlerParams extends BaseCreateFastifyHandlerParams {
    debug?: boolean;
}

export const createHandler = <Payload = any, Response = any>(
    params: CreateHandlerParams
): HandlerCallable<Payload, Response> => {
    return (payload, context) => {
        const app = createFastify({
            plugins: params.plugins,
            options: {
                logger: params.debug === true,
                ...(params.options || {})
            }
        });
        /**
         * There must be an event plugin for this handler to work.
         */
        const plugins = app.webiny.plugins.byType<PayloadEventHandler>(PayloadEventHandler.type);
        const handler = plugins.shift();
        if (!handler) {
            throw new Error(
                `@webiny/handler-fastify-aws/payload must have PayloadEventHandler set.`
            );
        }

        app.post(url, async (request, reply) => {
            const params: PayloadHandlerCallableParams<Payload> = {
                request,
                context: app.webiny,
                payload,
                lambdaContext: context
            };
            app.__webiny_raw_result = await handler.cb(params);

            return reply.send({});
        });
        return new Promise((resolve, reject) => {
            app.inject(
                {
                    method: "POST",
                    url,
                    payload: payload || {},
                    query: {},
                    headers: {}
                },
                err => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(app.__webiny_raw_result);
                }
            );
        });
    };
};

export * from "./plugins/PayloadEventHandler";
