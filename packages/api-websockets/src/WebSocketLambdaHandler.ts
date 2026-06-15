import type { Container } from "@webiny/di";
import { WebSocketEventHandler } from "@webiny/event-handler-aws/abstractions/handlers/WebSocketEventHandler.js";
import type { IWebSocketEvent } from "@webiny/event-handler-aws/eventTypes/WebSocketEventType.js";
import { GraphQLContextEnhancer } from "@webiny/handler-graphql";
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
import { WebsocketsEventValidator } from "~/validator/index.js";
import { WebsocketsResponse } from "~/response/index.js";
import type { Context } from "~/types.js";
import { getEventValues } from "~/handler/headers.js";
import type { IWebsocketsIncomingEvent } from "~/handler/types.js";
import { ConnectionRegistry } from "~/features/ConnectionRegistry/abstractions.js";

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
        const ctx: Record<string, any> = { container: this.container };
        for (const enhancer of this.container.resolveAll(GraphQLContextEnhancer)) {
            await enhancer.enhance(ctx);
        }

        const event = eventCtx.event as IWebsocketsIncomingEvent;
        const { token, tenant } = getEventValues(event);

        const identity = await this.authCtx.authenticate(token ?? "");
        this.identityCtx.setIdentity(identity);

        const tenantResult = await this.getTenantById.execute(tenant);
        if (tenantResult.isOk()) {
            this.tenantCtx.setTenant(tenantResult.value);
        }

        const registry = this.container.resolve(ConnectionRegistry);
        const runner = new WebsocketsRunner(
            ctx as Context,
            registry,
            new WebsocketsEventValidator(),
            new WebsocketsResponse()
        );

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
