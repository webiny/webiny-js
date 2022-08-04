import awsLambdaFastify, {
    LambdaFastifyOptions as LambdaOptions,
    LambdaResponse
} from "@fastify/aws-lambda";
import { APIGatewayEvent, Context as LambdaContext } from "aws-lambda";
import {
    createHandler as createBaseHandler,
    CreateHandlerParams as BaseCreateHandlerParams,
    RoutePlugin
} from "@webiny/handler";

export interface HandlerCallable {
    (event: APIGatewayEvent, ctx: LambdaContext): Promise<LambdaResponse>;
}

export interface CreateHandlerParams extends BaseCreateHandlerParams {
    http?: {
        debug?: boolean;
    };
    lambdaOptions?: LambdaOptions;
}

export const createHandler = (params: CreateHandlerParams): HandlerCallable => {
    return (event, context) => {
        const app = createBaseHandler({
            plugins: params.plugins,
            options: {
                logger: params.http?.debug === true,
                ...(params.options || {})
            }
        });
        if (app.webiny.plugins.byType<RoutePlugin>(RoutePlugin.type).length === 0) {
            throw new Error(
                `To run @webiny/handler-aws/gateway, you must have at least one RoutePlugin set.`
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
                // audio
                "audio/x-mpequrl",
                "audio/midi",
                "audio/mpeg",
                "audio/x-realaudio",
                "audio/x-pn-realaudio",
                "audio/x-qt-stream",
                "audio/x-wav",
                // image
                "image/bmp",
                "image/gif",
                "image/x-freehand",
                "image/x-icon",
                "image/jpeg",
                "image/png",
                "image/tiff",
                "image/jpg",
                "image/gif",
                "image/webp",
                // video
                "video/x-msvideo",
                "video/x-flv",
                "video/quicktime",
                "video/quicktime",
                "video/x-mpg",
                // other
                "application/pdf",
                "text/rtf",
                "text/xml-svg",
                "text/x-sgml"
            ],
            ...(params.lambdaOptions || {})
        });
        return appLambda(event, context);
    };
};

export { RoutePlugin };
