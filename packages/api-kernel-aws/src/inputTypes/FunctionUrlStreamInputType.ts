import { InputType } from "@webiny/api-kernel-core";

import { FunctionUrlStreamInputHandler } from "~/abstractions/handlers/FunctionUrlStreamInputHandler.js";

/**
 * Recognises a Lambda Function URL HTTP invocation (payload format 2.0).
 *
 * The payload is all but identical to API Gateway v2, so this MUST NOT be registered in the same
 * container as `ApiGatewayInputType` — both would match and the first registration would win. That is
 * not a real constraint in practice: response streaming requires its own Lambda function (the handler
 * entry point is fixed per function and a streamified handler is only valid under RESPONSE_STREAM),
 * so the streaming composition root registers this one and never `ApiGatewayFeature`.
 */
class FunctionUrlStreamInputTypeImpl implements InputType.Interface<any> {
    matches(input: any): input is any {
        return Boolean(input?.rawPath && input?.requestContext?.http?.method);
    }

    getHandlerAbstraction() {
        return FunctionUrlStreamInputHandler;
    }
}

export const FunctionUrlStreamInputType = InputType.createImplementation({
    implementation: FunctionUrlStreamInputTypeImpl,
    dependencies: []
});
