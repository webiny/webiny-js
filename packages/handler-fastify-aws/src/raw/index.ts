import {
    createFastify,
    CreateFastifyHandlerParams as BaseCreateFastifyHandlerParams
} from "@webiny/fastify";
import { Context as LambdaContext, APIGatewayProxyResult } from "aws-lambda";
import { RawEventHandler, RawEventHandlerCallableParams } from "./plugins/RawEventHandler";

const url = "/webiny-raw-event";

export interface HandlerCallable<T> {
    (event: T, context: LambdaContext): Promise<APIGatewayProxyResult>;
}

export interface CreateHandlerParams extends BaseCreateFastifyHandlerParams {
    debug?: boolean;
}

export const createHandler = <T = any>(params: CreateHandlerParams): HandlerCallable<T> => {
    return (event, context) => {
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
        const plugins = app.webiny.plugins.byType<RawEventHandler>(RawEventHandler.type);
        const handler = plugins.shift();
        if (!handler) {
            throw new Error(`@webiny/handler-fastify-aws/raw must have RawEventHandler set.`);
        }

        app.post(url, async (request, reply) => {
            const params: RawEventHandlerCallableParams<T> = {
                request,
                context: app.webiny,
                event,
                lambdaContext: context
            };
            const result = await handler.cb(params);

            return reply.send(result);
        });
        app.decorateRequest("awsRaw", {
            getter: () => ({
                get event() {
                    return event;
                },
                get context() {
                    return context;
                }
            })
        });
        return new Promise(resolve => {
            app.inject(
                {
                    method: "POST",
                    url,
                    payload: event || {},
                    query: {},
                    headers: {}
                },
                (err, result) => {
                    if (err) {
                        return resolve({
                            statusCode: 500,
                            body: JSON.stringify(err),
                            headers: {}
                        });
                    }
                    const isBase64Encoded =
                        !!result.headers["x-base64-encoded"] || !!result.headers["x-binary"];
                    const response: APIGatewayProxyResult = {
                        statusCode: result.statusCode,
                        body: isBase64Encoded
                            ? result.rawPayload.toString("base64")
                            : result.payload,
                        headers: result.headers as APIGatewayProxyResult["headers"],
                        isBase64Encoded
                    };
                    return resolve(response);
                }
            );
        });
    };
};

export * from "./plugins/RawEventHandler";
