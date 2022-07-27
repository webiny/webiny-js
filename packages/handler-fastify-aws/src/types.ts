import { APIGatewayEvent, S3Event, Context as LambdaContext } from "aws-lambda";

export * from "@webiny/fastify/types";

declare module "fastify" {
    export interface FastifyRequest {
        awsLambdaEvent: {
            event: APIGatewayEvent;
            context: LambdaContext;
        };
        s3Event: {
            event: S3Event;
            context: LambdaContext;
        };
        rawEvent: {
            event: any;
            context: LambdaContext;
        };
    }
}
