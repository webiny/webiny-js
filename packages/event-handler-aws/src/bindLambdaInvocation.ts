import type { Container } from "@webiny/di";
import type { Context } from "@webiny/aws-sdk/types/index.js";
import { AwsLambdaEvent } from "./abstractions/AwsLambdaEvent.js";
import { AwsLambdaContext } from "./abstractions/AwsLambdaContext.js";
import { AwsLambdaContextValue } from "./abstractions/AwsLambdaContext.js";
import { NullAwsLambdaContext } from "./abstractions/NullAwsLambdaContext.js";

function createContextValue(context: Context | undefined): AwsLambdaContext.Interface {
    if (context) {
        return new AwsLambdaContextValue(context);
    }
    return new NullAwsLambdaContext();
}

/**
 * Registers a Lambda invocation's event and context into a handler execution's container, for both
 * Lambda handler platforms. `AwsLambdaContext` is ALWAYS registered — a `NullAwsLambdaContext` when
 * the invocation had no context — so consumers can resolve it unconditionally and branch on `isSet()`.
 */
export function bindLambdaInvocation(
    container: Container,
    event: any,
    context: Context | undefined
): void {
    const contextValue = createContextValue(context);

    container.registerInstance(AwsLambdaEvent, event);
    container.registerInstance(AwsLambdaContext, contextValue);
}
