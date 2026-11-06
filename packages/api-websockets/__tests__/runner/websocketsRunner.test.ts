import { describe, it, expect } from "vitest";
import { WebsocketsRunner } from "~/runner";
import { useHandler } from "~tests/helpers/useHandler";
import { MockWebsocketsEventValidator } from "~tests/mocks/MockWebsocketsEventValidator";
import { WebsocketsResponse } from "~/response/abstractions/WebsocketsResponse.js";
import { ConnectionRegistry } from "~/features/ConnectionRegistry/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { AnonymousIdentity } from "@webiny/api-core/features/security/IdentityContext/index.js";

describe("websockets runner", () => {
    it("should run and fail the route action - missing route", async () => {
        const handler = useHandler();

        const context = await handler.handle();
        const validator = new MockWebsocketsEventValidator();
        const response = context.container.resolve(WebsocketsResponse);

        const runner = new WebsocketsRunner(context, response);

        const rawEvent = {
            context: {
                route: "aRouteKey"
            },
            body: JSON.stringify({
                token: "aToken",
                tenant: "root"
            })
        };

        const event = await validator.validate(rawEvent);
        const result = await runner.run(event);
        expect(result).toEqual({
            error: {
                code: "NO_ROUTE_HANDLERS",
                data: {
                    route: "aRouteKey"
                },
                message: "There are no handlers for the route: aRouteKey.",
                stack: expect.any(String)
            },
            message: 'Route "aRouteKey" action failed.',
            statusCode: 200
        });
    });

    it("should run and return good status - default route", async () => {
        const handler = useHandler();

        const context = await handler.handle();
        const validator = new MockWebsocketsEventValidator();
        const response = context.container.resolve(WebsocketsResponse);

        const runner = new WebsocketsRunner(context, response);

        const rawEvent = {
            context: {
                route: "default"
            },
            body: JSON.stringify({
                token: "aToken",
                tenant: "root"
            })
        };

        const event = await validator.validate(rawEvent);
        const result = await runner.run(event);
        expect(result).toEqual({
            statusCode: 200
        });
    });

    it("should run and return good status - connect route", async () => {
        const handler = useHandler();

        const context = await handler.handle();
        const validator = new MockWebsocketsEventValidator();
        const response = context.container.resolve(WebsocketsResponse);

        const runner = new WebsocketsRunner(context, response);

        const rawEvent = {
            context: {
                connectionId: "myConnectionIdAbcdefg",
                route: "connect",
                endpoint: "https://test.execute-api.us-east-1.amazonaws.com/dev"
            },
            body: JSON.stringify({
                token: "aToken",
                tenant: "root"
            })
        };

        const event = await validator.validate(rawEvent);
        const result = await runner.run(event);
        expect(result).toEqual({
            statusCode: 200
        });
    });

    it("should run and return error status - disconnect route", async () => {
        const handler = useHandler();

        const context = await handler.handle();
        const validator = new MockWebsocketsEventValidator();
        const response = context.container.resolve(WebsocketsResponse);

        const runner = new WebsocketsRunner(context, response);

        const rawEvent = {
            context: {
                connectionId: "myConnectionIdAbcdefg",
                route: "disconnect"
            },
            body: JSON.stringify({
                token: "aToken",
                tenant: "root"
            })
        };

        const event = await validator.validate(rawEvent);
        const result = await runner.run(event);
        expect(result).toMatchObject({
            error: {
                code: expect.stringContaining("CONNECTION_NOT_FOUND"),
                message: expect.stringContaining("myConnectionIdAbcdefg"),
                stack: expect.any(String)
            },
            message: 'Route "disconnect" action failed.',
            statusCode: 200
        });
    });

    it("should run and return good status - disconnect route", async () => {
        const handler = useHandler();

        const context = await handler.handle();
        const registry = context.container.resolve(ConnectionRegistry);
        const validator = new MockWebsocketsEventValidator();
        const response = context.container.resolve(WebsocketsResponse);

        const runner = new WebsocketsRunner(context, response);

        const beforeConnectConnectionsViaTenant = await registry.listViaTenant("root");
        expect(beforeConnectConnectionsViaTenant).toHaveLength(0);

        const beforeConnectConnectionsViaIdentity = await registry.listViaIdentity("id-1");
        expect(beforeConnectConnectionsViaIdentity).toHaveLength(0);

        const connectRawEvent = {
            context: {
                connectionId: "myConnectionIdAbcdefg",
                route: "connect",
                endpoint: "https://test.execute-api.us-east-1.amazonaws.com/dev"
            },
            body: JSON.stringify({
                token: "aToken",
                tenant: "root"
            })
        };

        const connectEvent = await validator.validate(connectRawEvent);
        const connectResult = await runner.run(connectEvent);
        expect(connectResult).toEqual({
            statusCode: 200
        });

        const afterConnectConnectionsViaTenant = await registry.listViaTenant("root");
        expect(afterConnectConnectionsViaTenant).toHaveLength(1);
        expect(afterConnectConnectionsViaTenant).toMatchObject([
            {
                connectionId: "myConnectionIdAbcdefg"
            }
        ]);

        const afterConnectConnectionsViaIdentity = await registry.listViaIdentity("id-12345678");
        expect(afterConnectConnectionsViaIdentity).toHaveLength(1);
        expect(afterConnectConnectionsViaIdentity).toMatchObject([
            {
                connectionId: "myConnectionIdAbcdefg"
            }
        ]);

        const disconnectRawEvent = {
            context: {
                connectionId: "myConnectionIdAbcdefg",
                route: "disconnect"
            },
            body: JSON.stringify({
                token: "aToken",
                tenant: "root"
            })
        };

        const disconnectEvent = await validator.validate(disconnectRawEvent);
        const result = await runner.run(disconnectEvent);
        expect(result).toEqual({
            statusCode: 200
        });

        const afterDisconnectConnectionsViaTenant = await registry.listViaTenant("root");
        expect(afterDisconnectConnectionsViaTenant).toHaveLength(0);

        const afterDisconnectConnectionsViaIdentity = await registry.listViaIdentity("id-1");
        expect(afterDisconnectConnectionsViaIdentity).toHaveLength(0);
    });

    it("should run and return good status - custom route", async () => {
        const handler = useHandler({
            plugins: [
                {
                    route: "myCustomRouteKey",
                    run: async ({ response }) => {
                        return response.ok();
                    }
                }
            ]
        });

        const context = await handler.handle();
        const validator = new MockWebsocketsEventValidator();
        const response = context.container.resolve(WebsocketsResponse);

        const runner = new WebsocketsRunner(context, response);

        const rawEvent = {
            context: {
                route: "myCustomRouteKey"
            },
            body: JSON.stringify({
                token: "aToken",
                tenant: "root"
            })
        };

        const event = await validator.validate(rawEvent);
        const result = await runner.run(event);
        expect(result).toEqual({
            statusCode: 200
        });
    });

    it("should return ok status even when body is not valid JSON", async () => {
        const handler = useHandler();

        const context = await handler.handle();
        const validator = new MockWebsocketsEventValidator();
        const response = context.container.resolve(WebsocketsResponse);

        const runner = new WebsocketsRunner(context, response);

        const rawEvent = {
            context: {
                route: "default"
            },
            body: "somethingWrong"
        };

        const event = await validator.validate(rawEvent);
        const result = await runner.run(event);
        expect(result).toEqual({
            statusCode: 200
        });
    });

    it.each(["connect", "default"])(
        "should refuse an anonymous identity - %s route",
        async route => {
            const handler = useHandler();

            const context = await handler.handle();
            // No token: `getIdentity()` returns an anonymous identity, never `undefined`.
            context.container.resolve(IdentityContext).setIdentity(new AnonymousIdentity());
            const validator = new MockWebsocketsEventValidator();
            const response = context.container.resolve(WebsocketsResponse);
            const registry = context.container.resolve(ConnectionRegistry);

            const runner = new WebsocketsRunner(context, response);

            const connectionId = `anonymousConnection-${route}`;
            const rawEvent = {
                context: {
                    connectionId,
                    route,
                    endpoint: "https://test.execute-api.us-east-1.amazonaws.com/dev"
                },
                body: JSON.stringify({
                    tenant: "root"
                })
            };

            const event = await validator.validate(rawEvent);
            const result = await runner.run(event);
            expect(result).toMatchObject({
                message: "Missing identity."
            });

            const connections = await registry.listViaConnections([connectionId]);
            expect(connections).toEqual([]);
        }
    );
});
