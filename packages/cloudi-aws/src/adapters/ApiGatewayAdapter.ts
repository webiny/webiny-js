import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "@webiny/aws-sdk/types/index.js";
import { CloudHandler } from "@cloudi/core";
import type { IHttpRequest, IHttpResponse, NextFunction } from "@cloudi/core";

function isApiGatewayEvent(event: any): event is APIGatewayProxyEvent {
    return !!(event?.httpMethod && event?.requestContext?.requestId);
}

function toHttpRequest(event: APIGatewayProxyEvent): IHttpRequest {
    let body: any;
    if (event.body) {
        try {
            body = JSON.parse(event.body);
        } catch {
            body = event.body;
        }
    }
    return {
        method: event.httpMethod,
        path: event.path,
        headers: (event.headers as Record<string, string>) || {},
        query: (event.queryStringParameters as Record<string, string>) || {},
        body
    };
}

function toApiGatewayResult(response: IHttpResponse): APIGatewayProxyResult {
    const { body } = response;

    if (Buffer.isBuffer(body) || body instanceof Uint8Array) {
        return {
            statusCode: response.statusCode,
            headers: response.headers,
            body: Buffer.from(body).toString("base64"),
            isBase64Encoded: true
        };
    }

    return {
        statusCode: response.statusCode,
        headers: response.headers,
        body:
            body === undefined || body === null
                ? ""
                : typeof body === "string"
                  ? body
                  : JSON.stringify(body)
    };
}

class ApiGatewayAdapterImpl implements CloudHandler.Interface {
    async execute(event: any, next: NextFunction): Promise<any> {
        if (!isApiGatewayEvent(event)) {
            return next();
        }
        const request = toHttpRequest(event);
        const response: IHttpResponse = await next(request);
        return toApiGatewayResult(response);
    }
}

export const ApiGatewayAdapter = CloudHandler.createImplementation({
    implementation: ApiGatewayAdapterImpl,
    dependencies: []
});
