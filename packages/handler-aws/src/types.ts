import { APIGatewayEvent, Context as LambdaContext } from "aws-lambda";
import "fastify";
export * from "@webiny/handler/types";

export enum Base64EncodeHeader {
    encoded = "x-webiny-base64-encoded",
    binary = "x-webiny-binary"
}

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
