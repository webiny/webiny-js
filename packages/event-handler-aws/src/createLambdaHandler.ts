import { HandlerApp } from "@webiny/event-handler-core";
import type { HandlerSetup } from "@webiny/event-handler-core";
import type { Context } from "@webiny/aws-sdk/types/index.js";
import { awsLambdaTransport } from "./AwsLambdaTransport.js";

export interface CreateLambdaHandlerOptions {
    root: HandlerSetup;
    request?: HandlerSetup;
}

/**
 * Thin AWS-Lambda-shaped wrapper over the transport-agnostic `createHandler`. The only
 * AWS-specific behavior — binding the raw Lambda event + context into the request container —
 * lives in {@link awsLambdaTransport}; everything else is the shared handler loop.
 */
export function createLambdaHandler(options: CreateLambdaHandlerOptions) {
    const app = HandlerApp.init({
        root: options.root,
        request: options.request,
        transport: awsLambdaTransport
    });

    return (event: any, context?: Context): Promise<any> => app.handle(event, context);
}
