import { APIGatewayEvent, S3Event, Context as LambdaContext } from "aws-lambda";

export * from "@webiny/fastify/types";

declare module "fastify" {
    export interface FastifyRequest {
        awsLambda: {
            event: APIGatewayEvent;
            context: LambdaContext;
        };
        awsS3: {
            event: S3Event;
            context: LambdaContext;
        };
        awsRaw: {
            event: any;
            context: LambdaContext;
        };
    }
}
