import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import type { IAuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/abstractions.js";
import type { IIdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import type { InputContext } from "@webiny/api-kernel-core";
import { InputHandler } from "@webiny/api-kernel-core";
import { WebSocketInputHandler } from "@webiny/api-kernel-aws/abstractions/handlers/WebSocketInputHandler.js";
import type { IWebSocketEvent } from "@webiny/api-kernel-aws/inputTypes/WebSocketInputType.js";
import { WebSocketLambdaHandler } from "~/WebSocketLambdaHandler.js";
import { WebSocketTenantSource } from "~/WebSocketTenantSource.js";

const connectEvent = (query: Record<string, string>) => {
    return {
        requestContext: { routeKey: "$connect", connectionId: "connection-1" },
        queryStringParameters: query
    };
};

describe("WebSocketTenantSource", () => {
    const source = new (WebSocketTenantSource as any)();
    const request = (event: any, abstraction: any = WebSocketInputHandler) => {
        return { container: new Container(), abstraction, input: event };
    };

    // An API key is looked up in the tenant, so the connection's tenant scope is the one it names.
    it("runs a WebSocket event in the tenant the client names", () => {
        const event = connectEvent({ token: "wat_123", tenant: "acme" });
        expect(source.getTenant(request(event))).toEqual({ tenantId: "acme" });
    });

    it("runs it as the root tenant when the client names none", () => {
        expect(source.getTenant(request(connectEvent({ token: "wat_123" })))).toEqual({
            tenantId: "root"
        });
    });

    it("doesn't know other events", () => {
        expect(source.getTenant(request(connectEvent({}), InputHandler))).toBeUndefined();
    });

    // A client still connected when its tenant is deleted must still disconnect, so its
    // connection record is removed; a $connect naming an unknown tenant keeps failing.
    it("runs a $disconnect of an unknown tenant in the root tenant's scope", () => {
        const event = {
            requestContext: {
                routeKey: "$disconnect",
                eventType: "DISCONNECT",
                connectionId: "connection-1"
            },
            queryStringParameters: { tenant: "deleted" }
        };
        expect(source.getTenant(request(event))).toEqual({
            tenantId: "deleted",
            ifUnknown: "root"
        });
    });

    it("fails a $connect of an unknown tenant", () => {
        const event = {
            requestContext: { routeKey: "$connect", eventType: "CONNECT", connectionId: "c-1" },
            queryStringParameters: { tenant: "deleted" }
        };
        expect(source.getTenant(request(event))).toEqual({ tenantId: "deleted" });
    });
});

describe("WebSocketLambdaHandler", () => {
    it("authenticates the event's token in the container it runs in", async () => {
        let authenticatedToken: string | null = null;
        const authenticationContext = {
            authenticate: async (token: string) => {
                authenticatedToken = token;
                return undefined;
            }
        } as unknown as IAuthenticationContext;
        const identityContext = {
            setIdentity: () => {
                // Not under test.
            }
        } as unknown as IIdentityContext;
        // The runner is not under test; the first container lookup ends the call.
        const container = {
            resolve: () => {
                throw new Error("Stop after authentication.");
            }
        } as unknown as Container;

        const handler = new WebSocketLambdaHandler(
            container,
            authenticationContext,
            identityContext
        );
        const eventContext = {
            input: connectEvent({ token: "wat_123", tenant: "acme" })
        } as unknown as InputContext<IWebSocketEvent>;

        await expect(handler.execute(eventContext, async () => undefined)).rejects.toThrow(
            "Stop after authentication."
        );
        expect(authenticatedToken).toBe("wat_123");
    });
});
