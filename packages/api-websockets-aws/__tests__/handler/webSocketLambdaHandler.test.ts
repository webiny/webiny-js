import { describe, it, expect } from "vitest";
import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/feature/api";
import type { IAuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/abstractions.js";
import type { IIdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import type { ITenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import type { IGetTenantByIdUseCase } from "@webiny/api-core/features/tenancy/GetTenantById/abstractions.js";
import type { EventContext } from "@webiny/kernel-core";
import type { IWebSocketEvent } from "@webiny/kernel-aws/eventTypes/WebSocketEventType.js";
import { WebSocketLambdaHandler } from "~/WebSocketLambdaHandler.js";

describe("WebSocketLambdaHandler", () => {
    it("sets the requested tenant before it authenticates the token", async () => {
        let currentTenant: string | null = null;
        let tenantWhenAuthenticating: string | null = "not called";

        const tenantContext = {
            getTenant: () => (currentTenant ? { id: currentTenant } : null),
            setTenant: (tenant: { id: string }) => {
                currentTenant = tenant.id;
            }
        } as unknown as ITenantContext;
        const authenticationContext = {
            authenticate: async () => {
                // An API key is looked up in the current tenant, so it fails without one.
                tenantWhenAuthenticating = currentTenant;
                return undefined;
            }
        } as unknown as IAuthenticationContext;
        const identityContext = {
            setIdentity: () => {
                // Not under test.
            }
        } as unknown as IIdentityContext;
        const getTenantById = {
            execute: async (id: string) => Result.ok({ id })
        } as unknown as IGetTenantByIdUseCase;
        // The runner is not under test; the first container lookup ends the call.
        const container = {
            resolve: () => {
                throw new Error("Stop after authentication.");
            }
        } as unknown as Container;

        const handler = new WebSocketLambdaHandler(
            container,
            authenticationContext,
            identityContext,
            tenantContext,
            getTenantById
        );

        const event = {
            requestContext: { routeKey: "$connect", connectionId: "connection-1" },
            queryStringParameters: { token: "wat_123", tenant: "acme" }
        };
        const eventContext = { event } as unknown as EventContext<IWebSocketEvent>;

        await expect(handler.execute(eventContext, async () => undefined)).rejects.toThrow(
            "Stop after authentication."
        );
        expect(tenantWhenAuthenticating).toBe("acme");
    });
});
