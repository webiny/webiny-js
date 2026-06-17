import type { APIGatewayProxyEvent } from "@webiny/aws-sdk/types/index.js";
import { ApiGatewayEventHandler } from "~/abstractions/handlers/ApiGatewayEventHandler.js";
import { AuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GetTenantByIdUseCase } from "@webiny/api-core/features/tenancy/GetTenantById/index.js";
import type { IAuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import type { IIdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import type { ITenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import type { IGetTenantByIdUseCase } from "@webiny/api-core/features/tenancy/GetTenantById/abstractions.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";

/**
 * Reads the Authorization header from the API Gateway event and authenticates
 * the request, setting the identity in IdentityContext.
 */
class ApiGatewayAuthDecoratorImpl implements ApiGatewayEventHandler.Interface {
    constructor(
        private authCtx: IAuthenticationContext,
        private identityCtx: IIdentityContext,
        private inner: ApiGatewayEventHandler.Interface
    ) {}

    async execute(ctx: EventContext<APIGatewayProxyEvent>, next: NextFunction): Promise<any> {
        const headers = ctx.event.headers ?? {};
        const raw = headers["authorization"] ?? headers["Authorization"] ?? "";
        // Strip "Bearer " prefix if present (the Authorization header standard uses this format)
        const token = raw.replace(/^Bearer\s+/i, "");
        const identity = await this.authCtx.authenticate(token);
        this.identityCtx.setIdentity(identity);
        return this.inner.execute(ctx, next);
    }
}

export const ApiGatewayAuthDecorator = ApiGatewayEventHandler.createDecorator({
    decorator: ApiGatewayAuthDecoratorImpl,
    dependencies: [AuthenticationContext, IdentityContext]
});

function parseCookieHeader(cookieHeader: string): Record<string, string> {
    return cookieHeader.split(";").reduce<Record<string, string>>((acc, pair) => {
        const idx = pair.indexOf("=");
        if (idx > 0) {
            acc[pair.slice(0, idx).trim()] = decodeURIComponent(pair.slice(idx + 1).trim());
        }
        return acc;
    }, {});
}

/**
 * Falls back to cookie-based authentication if the Bearer header did not yield an identity.
 * Reads the `wby-id-token` cookie and calls authenticate() with it.
 */
class ApiGatewayCookieAuthDecoratorImpl implements ApiGatewayEventHandler.Interface {
    constructor(
        private authCtx: IAuthenticationContext,
        private identityCtx: IIdentityContext,
        private inner: ApiGatewayEventHandler.Interface
    ) {}

    async execute(ctx: EventContext<APIGatewayProxyEvent>, next: NextFunction): Promise<any> {
        if (!this.identityCtx.getIdentity().isAnonymous()) {
            return this.inner.execute(ctx, next);
        }

        const headers = ctx.event.headers ?? {};
        const cookieHeader = headers["cookie"] ?? headers["Cookie"] ?? "";
        const token = parseCookieHeader(cookieHeader)["wby-id-token"];

        if (token) {
            const identity = await this.authCtx.authenticate(token);
            this.identityCtx.setIdentity(identity);
        }

        return this.inner.execute(ctx, next);
    }
}

export const ApiGatewayCookieAuthDecorator = ApiGatewayEventHandler.createDecorator({
    decorator: ApiGatewayCookieAuthDecoratorImpl,
    dependencies: [AuthenticationContext, IdentityContext]
});

/**
 * Reads the x-tenant header from the API Gateway event, loads the full Tenant
 * from storage, and sets it in TenantContext. Falls back to "root".
 */
class ApiGatewayTenantDecoratorImpl implements ApiGatewayEventHandler.Interface {
    constructor(
        private tenantCtx: ITenantContext,
        private getTenantById: IGetTenantByIdUseCase,
        private inner: ApiGatewayEventHandler.Interface
    ) {}

    async execute(ctx: EventContext<APIGatewayProxyEvent>, next: NextFunction): Promise<any> {
        const headers = ctx.event.headers ?? {};
        const tenantId = headers["x-tenant"] ?? headers["X-Tenant"] ?? "root";

        const result = await this.getTenantById.execute(tenantId);
        if (result.isOk()) {
            this.tenantCtx.setTenant(result.value);
        } else {
            // Tenant not found — continue anyway; downstream code will handle missing tenant
            console.warn(`[ApiGatewayTenantDecorator] Tenant "${tenantId}" not found.`);
        }

        return this.inner.execute(ctx, next);
    }
}

export const ApiGatewayTenantDecorator = ApiGatewayEventHandler.createDecorator({
    decorator: ApiGatewayTenantDecoratorImpl,
    dependencies: [TenantContext, GetTenantByIdUseCase]
});
