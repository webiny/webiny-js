import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "@webiny/aws-sdk/types/index.js";
import type { LambdaFunctionURLEvent } from "@webiny/aws-sdk/types/index.js";
import { HttpEventHandler } from "@webiny/event-handler-core";
import { ApiGatewayEventHandler } from "../abstractions/handlers/ApiGatewayEventHandler.js";
import type {
    EventContext,
    IHttpRequest,
    IHttpResponse,
    NextFunction
} from "@webiny/event-handler-core";

function isApiGatewayEvent(event: any): event is APIGatewayProxyEvent {
    return !!(event?.httpMethod && event?.requestContext?.requestId);
}

function isFunctionUrlEvent(event: any): event is LambdaFunctionURLEvent {
    return !!(
        event?.rawPath &&
        event?.requestContext?.http?.method &&
        event?.requestContext?.apiId
    );
}

function parseBody(raw: string | null | undefined, isBase64: boolean): any {
    if (!raw) {
        return undefined;
    }
    const str = isBase64 ? Buffer.from(raw, "base64").toString("utf-8") : raw;
    try {
        return JSON.parse(str);
    } catch {
        return str;
    }
}

function fromApiGateway(event: APIGatewayProxyEvent): IHttpRequest {
    return {
        method: event.httpMethod,
        path: event.path,
        headers: (event.headers as Record<string, string>) || {},
        query: (event.queryStringParameters as Record<string, string>) || {},
        pathParameters: (event.pathParameters as Record<string, string>) || {},
        body: parseBody(event.body, false)
    };
}

function fromFunctionUrl(event: LambdaFunctionURLEvent): IHttpRequest {
    return {
        method: event.requestContext.http.method,
        path: event.rawPath,
        headers: (event.headers as Record<string, string>) || {},
        query: (event.queryStringParameters as Record<string, string>) || {},
        pathParameters: (event.pathParameters as Record<string, string>) || {},
        body: parseBody(event.body, event.isBase64Encoded)
    };
}

function toResult(response: IHttpResponse): APIGatewayProxyResult {
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

class AwsHttpTranslatorImpl implements HttpEventHandler.Interface {
    async execute(ctx: EventContext, next: NextFunction): Promise<any> {
        let request: IHttpRequest;

        if (isApiGatewayEvent(ctx.event)) {
            request = fromApiGateway(ctx.event);
        } else if (isFunctionUrlEvent(ctx.event)) {
            request = fromFunctionUrl(ctx.event);
        } else {
            return next();
        }

        const httpCtx: EventContext<IHttpRequest> = { event: request, metadata: ctx.metadata };
        const response: IHttpResponse = await next(httpCtx);
        return toResult(response);
    }
}

export const AwsHttpTranslator = HttpEventHandler.createImplementation({
    implementation: AwsHttpTranslatorImpl,
    dependencies: []
});

export const AwsHttpTranslatorApiGateway = ApiGatewayEventHandler.createImplementation({
    implementation: AwsHttpTranslatorImpl,
    dependencies: []
});
