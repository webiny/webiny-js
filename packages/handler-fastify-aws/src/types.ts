import { APIGatewayEvent, Context as LambdaContext } from "aws-lambda";

export * from "@webiny/fastify/types";

export type { FastifyContext as Context } from "@webiny/fastify/types";

declare module "fastify" {
    interface FastifyInstance {
        __webiny_raw_result: any;
    }
    interface FastifyRequest {
        awsLambda: {
            event: APIGatewayEvent;
            context: LambdaContext;
        };
    }
}
