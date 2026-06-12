import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "@webiny/aws-sdk/types/index.js";
import { ApiGatewayEventHandler } from "~/abstractions/handlers/ApiGatewayEventHandler.js";
import { HttpRouter, RouteNotFoundError } from "@webiny/event-handler-core";
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

class ApiGatewayHttpRouterHandlerImpl implements ApiGatewayEventHandler.Interface {
    constructor(private router: HttpRouter.Interface) {}

    async execute(
        ctx: EventContext<APIGatewayProxyEvent>,
        _next: NextFunction
    ): Promise<APIGatewayProxyResult> {
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
