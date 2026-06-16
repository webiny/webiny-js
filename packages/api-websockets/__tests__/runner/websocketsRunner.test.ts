import { describe, it, expect } from "vitest";
import { WebsocketsRunner } from "~/runner";
import { useHandler } from "~tests/helpers/useHandler";
import { MockWebsocketsEventValidator } from "~tests/mocks/MockWebsocketsEventValidator";
import { WebsocketsContext } from "~/context/WebsocketsContext.js";
import { MockWebsocketsTransport } from "~tests/mocks/MockWebsocketsTransport";
import { createWebsocketsRoutePlugin } from "~/plugins";
import { WebsocketsResponse } from "~/response";

describe("websockets runner", () => {
    it("should run and fail the route action - missing route", async () => {
        const handler = useHandler();

        const context = await handler.handle();
        const registry = context.websockets.registry;
        const validator = new MockWebsocketsEventValidator();
        const response = new WebsocketsResponse();

        context.websockets = new WebsocketsContext(registry, new MockWebsocketsTransport());

        const runner = new WebsocketsRunner(context, registry, response);

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
                code: "NO_ROUTE_PLUGINS",
                data: {
                    route: "aRouteKey"
                },
                message: "There are no plugins for the route: aRouteKey.",
                stack: expect.any(String)
            },
            message: 'Route "aRouteKey" action failed.',
            statusCode: 200
        });
    });

    it("should run and return good status - default route", async () => {
        const handler = useHandler();

        const context = await handler.handle();
        const registry = context.websockets.registry;
        const validator = new MockWebsocketsEventValidator();
        const response = new WebsocketsResponse();

        context.websockets = new WebsocketsContext(registry, new MockWebsocketsTransport());

        const runner = new WebsocketsRunner(context, registry, response);

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
        const registry = context.websockets.registry;
        const validator = new MockWebsocketsEventValidator();
        const response = new WebsocketsResponse();

        context.websockets = new WebsocketsContext(registry, new MockWebsocketsTransport());

        const runner = new WebsocketsRunner(context, registry, response);

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
        const registry = context.websockets.registry;
        const validator = new MockWebsocketsEventValidator();
        const response = new WebsocketsResponse();

        context.websockets = new WebsocketsContext(registry, new MockWebsocketsTransport());

        const runner = new WebsocketsRunner(context, registry, response);

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
        const registry = context.websockets.registry;
        const validator = new MockWebsocketsEventValidator();
        const response = new WebsocketsResponse();

        context.websockets = new WebsocketsContext(registry, new MockWebsocketsTransport());

        const runner = new WebsocketsRunner(context, registry, response);

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
                createWebsocketsRoutePlugin("myCustomRouteKey", async ({ response }) => {
                    return response.ok();
                })
            ]
        });

        const context = await handler.handle();
        const registry = context.websockets.registry;
        const validator = new MockWebsocketsEventValidator();
        const response = new WebsocketsResponse();

        context.websockets = new WebsocketsContext(registry, new MockWebsocketsTransport());

        const runner = new WebsocketsRunner(context, registry, response);

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
        const registry = context.websockets.registry;
        const validator = new MockWebsocketsEventValidator();
        const response = new WebsocketsResponse();

        context.websockets = new WebsocketsContext(registry, new MockWebsocketsTransport());

        const runner = new WebsocketsRunner(context, registry, response);

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
});
