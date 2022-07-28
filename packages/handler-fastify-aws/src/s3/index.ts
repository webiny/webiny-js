import {
    createFastify,
    CreateFastifyHandlerParams as BaseCreateFastifyHandlerParams
} from "@webiny/fastify";
import { S3Event, Context as LambdaContext } from "aws-lambda";
import { S3EventHandler, S3EventHandlerCallableParams } from "./plugins/S3EventHandler";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";

const url = "/webiny-s3-event";

export interface HandlerCallable {
    (event: S3Event, context: LambdaContext): Promise<APIGatewayProxyResult>;
}

export interface CreateHandlerParams extends BaseCreateFastifyHandlerParams {
    debug?: boolean;
}

export const createHandler = (params: CreateHandlerParams): HandlerCallable => {
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
        const plugins = app.webiny.plugins.byType<S3EventHandler>(S3EventHandler.type);
        const handler = plugins.shift();
        if (!handler) {
            throw new Error(`@webiny/handler-fastify-aws/s3 must have S3EventHandler set.`);
        }

        app.post(url, async (request, reply) => {
            const params: S3EventHandlerCallableParams = {
                request,
                context: app.webiny,
                event,
                lambdaContext: context
            };
            const result = await handler.cb(params);

            return reply.send(result);
        });
        app.decorateRequest("awsS3", {
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

export * from "./plugins/S3EventHandler";
