// Translator: converts between transport-specific format and IHttpRequest/IHttpResponse. Not an Adapter (which implies interface compatibility).
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "@webiny/aws-sdk/types/index.js";
import { ApiGatewayEventHandler } from "~/abstractions/handlers/ApiGatewayEventHandler.js";
import type {
    EventContext,
    IHttpRequest,
    IHttpResponse,
    NextFunction
} from "@webiny/event-handler-core";

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
        pathParameters: (event.pathParameters as Record<string, string>) || {},
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

class ApiGatewayTranslatorImpl implements ApiGatewayEventHandler.Interface {
    async execute(ctx: EventContext<APIGatewayProxyEvent>, next: NextFunction): Promise<any> {
        const request = toHttpRequest(ctx.event);
        const httpCtx: EventContext<IHttpRequest> = { event: request, metadata: ctx.metadata };
        const response: IHttpResponse = await next(httpCtx);
        return toApiGatewayResult(response);
    }
}

export const ApiGatewayTranslator = ApiGatewayEventHandler.createImplementation({
    implementation: ApiGatewayTranslatorImpl,
    dependencies: []
});
