import type { Container } from "@webiny/feature/api";
import { WebSocketEventHandler } from "@webiny/event-handler-aws/abstractions/handlers/WebSocketEventHandler.js";
import type { IWebSocketEvent } from "@webiny/event-handler-aws/eventTypes/WebSocketEventType.js";
import { RequestContainer } from "@webiny/event-handler-core";
import { AuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GetTenantByIdUseCase } from "@webiny/api-core/features/tenancy/GetTenantById/index.js";
import type { IAuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/abstractions.js";
import type { IIdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import type { ITenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import type { IGetTenantByIdUseCase } from "@webiny/api-core/features/tenancy/GetTenantById/abstractions.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import type { APIGatewayProxyResult } from "@webiny/aws-sdk/types/index.js";
import { WebsocketsRunner } from "~/runner/index.js";
import { WebsocketsResponse } from "~/response/index.js";
import type { Context, IWebsocketsEvent, WebsocketsEventType } from "~/types.js";
import { getEventValues } from "~/handler/headers.js";
import type { IWebsocketsIncomingEvent } from "~/handler/types.js";
import { WebsocketsEventRequestContextEventType, WebsocketsEventRoute } from "~/handler/types.js";

const toWebsocketsEvent = (raw: IWebsocketsIncomingEvent, endpoint: string): IWebsocketsEvent => {
    const rc = raw.requestContext ?? {};
    const eventTypeMap: Record<string, WebsocketsEventType> = {
        [WebsocketsEventRequestContextEventType.message]: "message",
        [WebsocketsEventRequestContextEventType.connect]: "connect",
        [WebsocketsEventRequestContextEventType.disconnect]: "disconnect"
    };
    const routeKey = rc.routeKey as string | undefined;
    return {
        headers: raw.headers as Record<string, string> | undefined,
        context: {
            connectionId: rc.connectionId ?? "",
            connectedAt: rc.connectedAt ?? 0,
            host: rc.domainName ?? "",
            eventType: eventTypeMap[rc.eventType ?? ""] ?? "message",
            route: routeKey ?? WebsocketsEventRoute.default,
            endpoint
        },
        body:
            typeof raw.body === "string"
                ? (() => {
                      try {
                          return JSON.parse(raw.body as string);
                      } catch {
                          return {};
                      }
                  })()
                : (raw.body as any)
    };
};

class WebSocketLambdaHandlerImpl implements WebSocketEventHandler.Interface {
    constructor(
        private container: Container,
        private authCtx: IAuthenticationContext,
        private identityCtx: IIdentityContext,
        private tenantCtx: ITenantContext,
        private getTenantById: IGetTenantByIdUseCase
    ) {}

    async execute(
        eventCtx: EventContext<IWebSocketEvent>,
        _next: NextFunction
    ): Promise<APIGatewayProxyResult> {
        // Route handlers and all websockets services are resolved from the DI container;
        // the runner only needs `container` on the context object.
        const ctx: Record<string, any> = { container: this.container };

        const raw = eventCtx.event as IWebsocketsIncomingEvent;
        const { token, tenant, endpoint } = getEventValues(raw);

        const identity = await this.authCtx.authenticate(token ?? "");
        this.identityCtx.setIdentity(identity);

        const tenantResult = await this.getTenantById.execute(tenant);
        if (tenantResult.isOk()) {
            this.tenantCtx.setTenant(tenantResult.value);
        }

        const response = this.container.resolve(WebsocketsResponse);
        const runner = new WebsocketsRunner(ctx as Context, response);
        const event = toWebsocketsEvent(raw, endpoint);
        const result = await runner.run(event);

        return {
            statusCode: result.statusCode,
            headers: { "sec-websocket-protocol": "webiny-ws-v1" },
            body: ""
        };
    }
}

export const WebSocketLambdaHandler = WebSocketEventHandler.createImplementation({
    implementation: WebSocketLambdaHandlerImpl,
    dependencies: [
        RequestContainer,
        AuthenticationContext,
        IdentityContext,
        TenantContext,
        GetTenantByIdUseCase
    ]
});
