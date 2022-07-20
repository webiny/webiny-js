import { FastifyContext } from "@webiny/handler-fastify/types";
import { APIGatewayEvent } from "aws-lambda";
import { Context as AwsLambdaContext } from "aws-lambda/handler";

export interface FastifyAwsContext extends Omit<FastifyContext, "args"> {
    /**
     * We expect args to be an array with at least two items in it.
     * We do a check in actual handler, but this makes it easier.
     */
    args: [APIGatewayEvent | undefined, AwsLambdaContext | undefined] | [];
}
