import {
    createFastify,
    CreateFastifyHandlerParams as BaseCreateFastifyHandlerParams
} from "@webiny/fastify";
import { S3Event, Context as LambdaContext } from "aws-lambda";
import { S3EventHandler, S3EventHandlerCallableParams } from "./plugins/S3EventHandler";

const url = "/webiny-s3-event";

interface HandlerCallable {
    (event: S3Event, context: LambdaContext): Promise<void>;
}

export interface CreateHandlerParams extends BaseCreateFastifyHandlerParams {
    debug?: boolean;
}

export const createHandler = (params: CreateHandlerParams): HandlerCallable => {
    return (event, context) => {
        const app = createFastify({
            plugins: params.plugins,
            options: {
                logger: params?.debug === true,
                ...(params?.options || {})
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

        app.post(url, async request => {
            const params: S3EventHandlerCallableParams = {
                request,
                context: app.webiny,
                event,
                lambdaContext: context
            };
            await handler.cb(params);
        });
        app.decorateRequest("s3", {
            getter: () => ({
                get event() {
                    return event;
                },
                get context() {
                    return context;
                }
            })
        });
        return new Promise((resolve, reject) => {
            app.inject(
                {
                    method: "POST",
                    url,
                    payload: event || {},
                    query: {},
                    headers: {}
                },
                err => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve();
                }
            );
        });
    };
};

export * from "./plugins/S3EventHandler";
