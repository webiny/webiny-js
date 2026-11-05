import { HandlerApp } from "@webiny/event-handler-core";
import type { HandlerSetup } from "@webiny/event-handler-core";
import type { Context } from "@webiny/aws-sdk/types/index.js";
import { AwsLambdaHandlerPlatform } from "./AwsLambdaHandlerPlatform.js";

export interface CreateLambdaHandlerOptions {
    root: HandlerSetup;
    child?: HandlerSetup;
}

/**
 * Thin AWS-Lambda-shaped wrapper over the platform-agnostic `HandlerApp`. The only
 * AWS-specific behavior — binding the raw Lambda event + context into the request container, and
 * the execution id — lives in {@link AwsLambdaHandlerPlatform}; everything else is the shared
 * handler loop.
 */
export function createLambdaHandler(options: CreateLambdaHandlerOptions) {
    const app = HandlerApp.init({
        root: options.root,
        child: options.child,
        app: container => {
            container.register(AwsLambdaHandlerPlatform).inSingletonScope();
        }
    });

    return (event: any, context?: Context): Promise<any> => app.handle(event, context);
}
