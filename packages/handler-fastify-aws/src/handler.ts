import awsLambdaFastify, { LambdaResponse } from "@fastify/aws-lambda";
import { APIGatewayEvent, Context as LambdaContext } from "aws-lambda";
import { createFastify, CreateFastifyHandlerParams } from "@webiny/fastify";

export interface FastifyAwsHandlerCallable {
    (event: APIGatewayEvent, ctx: LambdaContext): Promise<LambdaResponse>;
}

export interface CreateAwsFastifyHandlerParams extends CreateFastifyHandlerParams {
    http?: {
        debug?: boolean;
    };
}

export const createAwsFastifyHandler = (
    params: CreateAwsFastifyHandlerParams
): FastifyAwsHandlerCallable => {
    return (event, context) => {
        const app = createFastify({
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
