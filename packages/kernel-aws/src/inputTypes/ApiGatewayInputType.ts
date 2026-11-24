import type { APIGatewayProxyEvent } from "@webiny/aws-sdk/types/index.js";
import { InputType } from "@webiny/kernel-core";
import { ApiGatewayInputHandler } from "../abstractions/handlers/ApiGatewayInputHandler.js";

class ApiGatewayInputTypeImpl implements InputType.Interface<APIGatewayProxyEvent> {
    matches(input: any): input is APIGatewayProxyEvent {
        // v1 / HTTP API v1 payload format: httpMethod + path
        // requestContext.requestId is present in real API GW invocations but absent in
        // direct CLI-style Lambda invocations, so we only require httpMethod + path.
        if (input?.httpMethod && input?.path) {
            return true;
        }
        // v2 HTTP API payload format: rawPath + requestContext.http.method
        if (
            input?.rawPath &&
            input?.requestContext?.http?.method &&
            input?.requestContext?.requestId
        ) {
            return true;
        }
        return false;
    }

    getHandlerAbstraction() {
        return ApiGatewayInputHandler;
    }
}

export const ApiGatewayInputType = InputType.createImplementation({
    implementation: ApiGatewayInputTypeImpl,
    dependencies: []
});
