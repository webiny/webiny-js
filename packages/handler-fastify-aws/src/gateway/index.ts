import awsLambdaFastify, { LambdaFastifyOptions, LambdaResponse } from "@fastify/aws-lambda";
import { APIGatewayEvent, Context as LambdaContext } from "aws-lambda";
import { createFastify, CreateFastifyHandlerParams, RoutePlugin } from "@webiny/fastify";

export interface HandlerCallable {
    (event: APIGatewayEvent, ctx: LambdaContext): Promise<LambdaResponse>;
}

export interface CreateHandlerParams extends CreateFastifyHandlerParams {
    http?: {
        debug?: boolean;
    };
    lambdaOptions?: LambdaFastifyOptions;
}

export const createHandler = (params: CreateHandlerParams): HandlerCallable => {
    return (event, context) => {
        const app = createFastify({
            plugins: params.plugins,
            options: {
                logger: params.http?.debug === true,
                ...(params.options || {})
            }
        });
        if (app.webiny.plugins.byType<RoutePlugin>(RoutePlugin.type).length === 0) {
            throw new Error(
                `To run @webiny/handler-fastify-aws/gateway, you must have at least one RoutePlugin set.`
            );
        }
        const appLambda = awsLambdaFastify(app, {
            decorateRequest: true,
            serializeLambdaArguments: true,
            decorationPropertyName: "awsLambda",
            /**
             * This is required until this part of aws-lambda-fastify is released: https://github.com/fastify/aws-lambda-fastify/blob/master/index.js#L6
             */
            binaryMimeTypes: [
                "video/x-msvideo",
                "image/bmp",
                "image/gif",
                "video/x-flv",
                "image/x-freehand",
                "image/x-icon",
                "image/jpeg",
                "audio/x-mpequrl",
                "audio/midi",
                "audio/midi",
                "video/quicktime",
                "audio/mpeg",
                "image/png",
                "video/quicktime",
                "audio/x-realaudio",
                "audio/x-pn-realaudio",
                "audio/x-qt-stream",
                "image/tiff",
                "image/tiff",
                "video/x-mpg",
                "audio/x-wav",
                "image/jpg",
                "image/gif",
                "image/webp"
            ],
            ...(params.lambdaOptions || {})
        });
        return appLambda(event, context);
    };
};

export { RoutePlugin };
