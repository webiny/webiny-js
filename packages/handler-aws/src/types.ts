import { APIGatewayEvent, Context as LambdaContext } from "aws-lambda";
import "fastify";
export * from "@webiny/handler/types";

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
