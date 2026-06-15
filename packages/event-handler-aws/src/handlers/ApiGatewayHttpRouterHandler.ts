import type { APIGatewayProxyResult } from "@webiny/aws-sdk/types/index.js";
import { ApiGatewayEventHandler } from "~/abstractions/handlers/ApiGatewayEventHandler.js";
import { HttpRouter, RouteNotFoundError } from "@webiny/event-handler-core";
import type {
    EventContext,
    IHttpRequest,
    IHttpResponse,
    NextFunction
} from "@webiny/event-handler-core";

function toHttpRequest(event: any): IHttpRequest {
    let body: any;
    if (event.body) {
        try {
            body = JSON.parse(event.body);
        } catch {
            body = event.body;
        }
    }
    // v2 HTTP API payload format: rawPath + requestContext.http.method
    if (event.rawPath) {
        // rawPath includes the stage prefix for named stages, e.g.
        // /myproj-default-198dde5/graphql — strip it so routes match as registered.
        let path: string = event.rawPath;
        const stage: string | undefined = event.requestContext?.stage;
        if (stage && stage !== "$default") {
            const prefix = `/${stage}`;
            if (path.startsWith(`${prefix}/`)) {
                path = path.slice(prefix.length);
            } else if (path === prefix) {
                path = "/";
            }
        }
        return {
            method: event.requestContext.http.method,
            path,
            headers: (event.headers as Record<string, string>) || {},
            query: event.queryStringParameters || {},
            pathParameters: (event.pathParameters as Record<string, string>) || {},
            body
        };
    }
    // v1 / HTTP API v1 payload format: httpMethod + path.
    // In HTTP API (v2) with payload format 1.0, event.path includes the stage prefix,
    // e.g. /myproj-default-198dde5/graphql. Strip it so routes match as registered.
    let v1Path: string = event.path;
    const v1Stage: string | undefined = event.requestContext?.stage;
    if (v1Stage) {
        const prefix = `/${v1Stage}`;
        if (v1Path.startsWith(`${prefix}/`)) {
            v1Path = v1Path.slice(prefix.length);
        } else if (v1Path === prefix) {
            v1Path = "/";
        }
    }
    return {
        method: event.httpMethod,
        path: v1Path,
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

class ApiGatewayHttpRouterHandlerImpl implements ApiGatewayEventHandler.Interface {
    constructor(private router: HttpRouter.Interface) {}

    async execute(ctx: EventContext<any>, _next: NextFunction): Promise<APIGatewayProxyResult> {
        const request = toHttpRequest(ctx.event);
        try {
            const response = await this.router.route(request);
            return toApiGatewayResult(response);
        } catch (e) {
            if (e instanceof RouteNotFoundError) {
                return toApiGatewayResult({ statusCode: 404, body: { message: e.message } });
            }
            if (e && typeof e === "object" && (e as any).code) {
                return toApiGatewayResult({
                    statusCode: 500,
                    body: {
                        message: (e as any).message,
                        code: (e as any).code,
                        data: (e as any).data ?? null
                    }
                });
            }
            console.error("HTTP handler error:", e);
            return toApiGatewayResult({
                statusCode: 500,
                body: { message: "Internal server error" }
            });
        }
    }
}

export const ApiGatewayHttpRouterHandler = ApiGatewayEventHandler.createImplementation({
    implementation: ApiGatewayHttpRouterHandlerImpl,
    dependencies: [HttpRouter]
});
