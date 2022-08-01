import { APIGatewayEvent, Context as LambdaContext } from "aws-lambda";

export * from "@webiny/fastify/types";

export type { FastifyContext as Context } from "@webiny/fastify/types";

declare module "fastify" {
    export interface FastifyInstance {
        __webiny_raw_result: any;
    }
    export interface FastifyRequest {
        awsLambda: {
            event: APIGatewayEvent;
            context: LambdaContext;
        };
    }
}
