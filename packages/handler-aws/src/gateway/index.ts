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
import { registerDefaultPlugins } from "~/plugins";
import { Base64EncodeHeader } from "~/types";
import { LightMyRequestResponse } from "fastify";

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
        /**
         * We always must add our default plugins to the app.
         */
        registerDefaultPlugins(app.webiny);

        if (app.webiny.plugins.byType<RoutePlugin>(RoutePlugin.type).length === 0) {
            throw new Error(
                `To run @webiny/handler-aws/gateway, you must have at least one RoutePlugin set.`
            );
        }
        /**
         * Until PR is merged, which fixes the type, leave this part.
         * https://github.com/fastify/aws-lambda-fastify/pull/121
         */
        const enforceBase64: any = (response: LightMyRequestResponse) => {
            return (
                !!response.headers[Base64EncodeHeader.encoded] ||
                !!response.headers[Base64EncodeHeader.binary]
            );
        };
        const appLambda = awsLambdaFastify(app, {
            decorateRequest: true,
            serializeLambdaArguments: true,
            decorationPropertyName: "awsLambda",
            enforceBase64,
            ...(params.lambdaOptions || {})
        });
        return appLambda(event, context);
    };
};

export { RoutePlugin };
