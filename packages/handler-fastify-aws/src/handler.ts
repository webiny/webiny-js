import { HandlerPlugin } from "@webiny/handler";
import { FastifyAwsContext } from "~/types";
import awsLambdaFastify from "@fastify/aws-lambda";
import WebinyError from "@webiny/error";

export const createAwsFastifyHandler = () => {
    return new HandlerPlugin<FastifyAwsContext>(async context => {
        if (!context.args || context.args.length < 2) {
            throw new WebinyError(
                `AWS Lambda Fastify cannot be run without event and context variables which are taken from "context.args".`,
                "ARGS_ERROR",
                {
                    args: context.args
                }
            );
        }
        const [event, ctx] = context.args;
        if (!event) {
            throw new WebinyError(
                `AWS Lambda Fastify cannot be run without event variable which is taken from "context.args[0]".`,
                "ARGS_ERROR",
                {
                    args: context.args
                }
            );
        } else if (!ctx) {
            throw new WebinyError(
                `AWS Lambda Fastify cannot be run without context variable which is taken from "context.args[1]".`,
                "ARGS_ERROR",
                {
                    args: context.args
                }
            );
        }

        return awsLambdaFastify(context.server, {
            decorateRequest: true,
            serializeLambdaArguments: true
        })(event, ctx);
    });
};
