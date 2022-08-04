import awsLambdaFastify, { LambdaResponse } from "@fastify/aws-lambda";
import { APIGatewayEvent, Context as LambdaContext } from "aws-lambda";
import {
    createHandler as createBaseHandler,
    CreateHandlerParams as BaseCreateHandlerParams
} from "@webiny/fastify";

export interface AwsHandlerCallable {
    (event: APIGatewayEvent, ctx: LambdaContext): Promise<LambdaResponse>;
}

export interface CreateAwsHandlerParams extends BaseCreateHandlerParams {
    http?: {
        debug?: boolean;
    };
}

export const createAwsHandler = (params: CreateAwsHandlerParams): AwsHandlerCallable => {
    return (event, context) => {
        const app = createBaseHandler({
            plugins: params?.plugins || [],
            options: {
                logger: params?.http?.debug === true,
                ...(params?.options || {})
            }
        });
        const appLambda = awsLambdaFastify(app, {
            decorateRequest: true,
            serializeLambdaArguments: true
        });
        return appLambda(event, context);
    };
};
