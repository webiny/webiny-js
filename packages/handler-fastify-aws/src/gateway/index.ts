import awsLambdaFastify, { LambdaResponse } from "@fastify/aws-lambda";
import { APIGatewayEvent, Context as LambdaContext } from "aws-lambda";
import { createFastify, CreateFastifyHandlerParams, RoutePlugin } from "@webiny/fastify";

export interface HandlerCallable {
    (event: APIGatewayEvent, ctx: LambdaContext): Promise<LambdaResponse>;
}

export interface CreateHandlerParams extends CreateFastifyHandlerParams {
    http?: {
        debug?: boolean;
    };
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
            decorationPropertyName: "awsLambda"
        });
        return appLambda(event, context);
    };
};

export { RoutePlugin };
