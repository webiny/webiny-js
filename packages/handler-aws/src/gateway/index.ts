import type { APIGatewayEvent, Context as LambdaContext } from "aws-lambda";
import awsLambdaFastify, { LambdaResponse } from "@fastify/aws-lambda";
import { createHandler as createBaseHandler, createRoute, RoutePlugin } from "@webiny/handler";
import { registerDefaultPlugins } from "~/plugins";
import { Base64EncodeHeader, HandlerFactoryParams } from "~/types";
import { APIGatewayProxyEventHeaders } from "aws-lambda/trigger/api-gateway-proxy";

export { RoutePlugin, createRoute };

export type HandlerParams = HandlerFactoryParams;

export interface HandlerCallable {
    (event: APIGatewayEvent, ctx: LambdaContext): Promise<LambdaResponse>;
}

const getHeader = (headers: APIGatewayProxyEventHeaders, header: string): string | undefined => {
    for (const key in headers) {
        if (key.toLowerCase() !== header) {
            continue;
        }
        return headers[key];
    }
    return undefined;
};

const defaultContentType = "application/json";
const defaultCharset = "utf-8";
/**
 * We need to attach default headers to the request, so it does not break if there is none sent.
 */
const attachRequiredProperties = (event: APIGatewayEvent): void => {
    /**
     * A possibility that headers are not defined?
     * Maybe during testing?
     */
    if (!event.headers) {
        event.headers = {};
    }
    const contentType = getHeader(event.headers, "content-type");
    /**
     * We check the existing content type and add the default one if it does not exist.
     *
     * Also, if the content-type is the application/json, and the body is not sent, we add it.
     */
    if (!contentType) {
        event.headers["content-type"] = [defaultContentType, `charset=${defaultCharset}`].join(";");
        event.body = "{}";
    } else if (!event.body && contentType.startsWith(defaultContentType)) {
        event.body = "{}";
    }
};

export const createHandler = (params: HandlerParams): HandlerCallable => {
    return async (event, context) => {
        const app = createBaseHandler({
            ...params,
            options: {
                logger: params.debug === true,
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
        attachRequiredProperties(event);

        const appLambda = awsLambdaFastify(app, {
            decorateRequest: true,
            serializeLambdaArguments: true,
            decorationPropertyName: "awsLambda",
            enforceBase64: response => {
                return (
                    !!response.headers[Base64EncodeHeader.encoded] ||
                    !!response.headers[Base64EncodeHeader.binary]
                );
            },
            ...(params.lambdaOptions || {})
        });
        return appLambda(event, context);
    };
};
