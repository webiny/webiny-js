import type { LambdaFunctionURLEvent } from "@webiny/aws-sdk/types/index.js";
import { HttpEventHandler } from "@webiny/event-handler-core";
import type {
    EventContext,
    IHttpRequest,
    IHttpResponse,
    NextFunction
} from "@webiny/event-handler-core";

function toHttpRequest(event: LambdaFunctionURLEvent): IHttpRequest {
    let body: any;
    if (event.body) {
        const raw = event.isBase64Encoded
            ? Buffer.from(event.body, "base64").toString("utf-8")
            : event.body;
        try {
            body = JSON.parse(raw);
        } catch {
            body = raw;
        }
    }

    return {
        method: event.requestContext.http.method,
        path: event.rawPath,
        headers: (event.headers as Record<string, string>) || {},
        query: (event.queryStringParameters as Record<string, string>) || {},
        pathParameters: (event.pathParameters as Record<string, string>) || {},
        body
    };
}

function toFunctionUrlResult(response: IHttpResponse) {
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

class FunctionUrlTranslatorImpl implements HttpEventHandler.Interface {
    async execute(ctx: EventContext<LambdaFunctionURLEvent>, next: NextFunction): Promise<any> {
        const request = toHttpRequest(ctx.event);
        const httpCtx: EventContext<IHttpRequest> = { event: request, metadata: ctx.metadata };
        const response: IHttpResponse = await next(httpCtx);
        return toFunctionUrlResult(response);
    }
}

export const FunctionUrlTranslator = HttpEventHandler.createImplementation({
    implementation: FunctionUrlTranslatorImpl,
    dependencies: []
});
