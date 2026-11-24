import type { Container } from "@webiny/feature/api";
import { WebSocketInputHandler } from "@webiny/kernel-aws/abstractions/handlers/WebSocketInputHandler.js";
import type { IWebSocketEvent } from "@webiny/kernel-aws/inputTypes/WebSocketInputType.js";
import { RequestContainer } from "@webiny/kernel-core";
import { AuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GetTenantByIdUseCase } from "@webiny/api-core/features/tenancy/GetTenantById/index.js";
import type { IAuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/abstractions.js";
import type { IIdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import type { ITenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import type { IGetTenantByIdUseCase } from "@webiny/api-core/features/tenancy/GetTenantById/abstractions.js";
import type { InputContext, NextFunction } from "@webiny/kernel-core";
import type { APIGatewayProxyResult } from "@webiny/aws-sdk/types/index.js";
import { WebsocketsRunner } from "@webiny/api-websockets/runner/index.js";
import { WebsocketsResponse } from "@webiny/api-websockets/response/index.js";
import type {
    Context,
    IWebsocketsEvent,
    WebsocketsEventType,
    WebsocketsRoute
} from "@webiny/api-websockets/types.js";
import { getEventValues } from "@webiny/api-websockets/handler/headers.js";
import type { IWebsocketsIncomingEvent } from "@webiny/api-websockets/handler/types.js";
import { WebsocketsEventRequestContextEventType, WebsocketsEventRoute } from "~/handler/types.js";
import type { GenericRecord } from "@webiny/api/types.js";

const getBody = (body: GenericRecord | string | undefined) => {
    if (typeof body === "string") {
        try {
            return JSON.parse(body) as GenericRecord;
        } catch {
            return {};
        }
    }
    return body;
};

const toWebsocketsEvent = (raw: IWebsocketsIncomingEvent, endpoint: string): IWebsocketsEvent => {
    const rc = raw.requestContext ?? {};
    const eventTypeMap: Record<string, WebsocketsEventType> = {
        [WebsocketsEventRequestContextEventType.message]: "message",
        [WebsocketsEventRequestContextEventType.connect]: "connect",
        [WebsocketsEventRequestContextEventType.disconnect]: "disconnect"
    };
    // AWS delivers routeKey as "$connect"/"$disconnect"/"$default"; route handlers register under the
    // un-prefixed WebsocketsRoute ("connect"/"disconnect"/"default"). Without this map the runner
    // matches the raw "$connect" and finds no handler ("There are no handlers for the route: $connect").
    const routeMap: Record<string, WebsocketsRoute> = {
        [WebsocketsEventRoute.connect]: "connect",
        [WebsocketsEventRoute.disconnect]: "disconnect",
        [WebsocketsEventRoute.default]: "default"
    };
    const routeKey = rc.routeKey as string | undefined;
    const route = routeMap[routeKey ?? ""] ?? "default";

    return {
        headers: raw.headers as Record<string, string> | undefined,
        context: {
            connectionId: rc.connectionId ?? "",
            connectedAt: rc.connectedAt ?? 0,
            host: rc.domainName ?? "",
            eventType: eventTypeMap[rc.eventType ?? ""] ?? "message",
            route,
            endpoint
        },
        body: getBody(raw.body)
    };
};

class WebSocketLambdaHandlerImpl implements WebSocketInputHandler.Interface {
    constructor(
        private container: Container,
        private authCtx: IAuthenticationContext,
        private identityCtx: IIdentityContext,
        private tenantCtx: ITenantContext,
        private getTenantById: IGetTenantByIdUseCase
    ) {}

    async execute(
        inputCtx: InputContext<IWebSocketEvent>,
        _next: NextFunction
    ): Promise<APIGatewayProxyResult> {
        // Route handlers and all websockets services are resolved from the DI container;
        // the runner only needs `container` on the context object.
        const ctx: Record<string, any> = { container: this.container };

        const raw = inputCtx.input as IWebsocketsIncomingEvent;
        const { token, tenant, endpoint } = getEventValues(raw);

        // The tenant first: an API key is looked up in the current tenant.
        const tenantResult = await this.getTenantById.execute(tenant);
        if (tenantResult.isOk()) {
            this.tenantCtx.setTenant(tenantResult.value);
        }

        const identity = await this.authCtx.authenticate(token ?? "");
        this.identityCtx.setIdentity(identity);

        const response = this.container.resolve(WebsocketsResponse);
        const runner = new WebsocketsRunner(ctx as Context, response);
        const event = toWebsocketsEvent(raw, endpoint);
        const result = await runner.run(event);

        return {
            statusCode: result.statusCode,
            headers: {
                "sec-websocket-protocol": "webiny-ws-v1"
            },
            body: ""
        };
    }
}

export const WebSocketLambdaHandler = WebSocketInputHandler.createImplementation({
    implementation: WebSocketLambdaHandlerImpl,
    dependencies: [
        RequestContainer,
        AuthenticationContext,
        IdentityContext,
        TenantContext,
        GetTenantByIdUseCase
    ]
});
