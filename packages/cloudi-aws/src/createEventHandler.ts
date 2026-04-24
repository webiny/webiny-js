import { Container } from "@webiny/di";
import type { Context } from "@webiny/aws-sdk/types/index.js";
import type { FunctionSetup } from "./types.js";
import { CloudHandler, AwsLambdaContext, AwsLambdaEvent } from "./abstractions/index.js";

export function createEventHandler(setup: FunctionSetup) {
    let container: Container | null = null;

    return async (event: any, context?: Context): Promise<any> => {
        if (!container) {
            container = new Container();
            await setup(container);
        }

        container.registerInstance(AwsLambdaEvent, event);
        if (context) {
            container.registerInstance(AwsLambdaContext, context);
        }

        const handlers = container.resolveAll(CloudHandler);
        if (handlers.length === 0) {
            throw new Error("No function handlers registered in container");
        }

        let chain: () => Promise<any> = () => {
            throw new Error("No registered function implementation handled this event");
        };

        for (let i = handlers.length - 1; i >= 0; i--) {
            const handler = handlers[i];
            const next = chain;
            chain = () => handler.execute(event, next);
        }

        return chain();
    };
}
