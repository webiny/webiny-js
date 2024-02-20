import { createHandler } from "~/handler/handler";
import { SocketsEventRoute } from "~/handler/types";
import { createMockLambdaContext } from "~tests/mocks/lambdaContext";
import { createPlugins } from "~tests/helpers/plugins";
import { createMockEvent } from "~tests/mocks/event";
import { useHandler } from "~tests/helpers/useHandler";

describe("handler", () => {
    it("should run handler with the given event - default route - ok status", async () => {
        const handler = createHandler({
            plugins: createPlugins()
        });

        const result = await handler(
            createMockEvent({
                requestContext: {
                    routeKey: SocketsEventRoute.default,
                    connectionId: "myConnectionId"
                },
                data: {
                    locale: "en-US",
                    tenant: "root",
                    identity: {
                        id: "myIdentityId"
                    }
                }
            }),
            createMockLambdaContext()
        );

        expect(result).toEqual({
            statusCode: 200
        });
    });

    it("should run handler with the given event - connect route - ok status", async () => {
        const handler = createHandler({
            plugins: createPlugins()
        });
        const contextHandler = useHandler();
        const context = await contextHandler.handle();

        const connectionsBeforeConnect = await context.sockets.listConnections({
            id: "myIdentityId"
        });
        expect(connectionsBeforeConnect).toHaveLength(0);

        const result = await handler(
            createMockEvent({
                requestContext: {
                    routeKey: SocketsEventRoute.connect,
                    connectionId: "myConnectionId"
                },
                data: {
                    locale: "en-US",
                    tenant: "root",
                    identity: {
                        id: "myIdentityId"
                    }
                }
            }),
            createMockLambdaContext()
        );

        expect(result).toEqual({
            statusCode: 200
        });

        const connectionsAfterConnect = await context.sockets.listConnections({
            id: "myIdentityId"
        });
        expect(connectionsAfterConnect).toHaveLength(1);
    });

    it("should run handler with the given event - disconnect route - ok status", async () => {
        const handler = createHandler({
            plugins: createPlugins()
        });
        const contextHandler = useHandler();
        const context = await contextHandler.handle();

        const connectionsBeforeConnect = await context.sockets.listConnections({
            id: "myIdentityId"
        });
        expect(connectionsBeforeConnect).toHaveLength(0);

        const connectResult = await handler(
            createMockEvent({
                requestContext: {
                    routeKey: SocketsEventRoute.connect,
                    connectionId: "myConnectionId"
                },
                data: {
                    locale: "en-US",
                    tenant: "root",
                    identity: {
                        id: "myIdentityId"
                    }
                }
            }),
            createMockLambdaContext()
        );

        expect(connectResult).toEqual({
            statusCode: 200
        });

        const connectionsAfterConnect = await context.sockets.listConnections({
            id: "myIdentityId"
        });
        expect(connectionsAfterConnect).toHaveLength(1);

        const disconnectResult = await handler(
            createMockEvent({
                requestContext: {
                    routeKey: SocketsEventRoute.disconnect,
                    connectionId: "myConnectionId"
                },
                data: {
                    locale: "en-US",
                    tenant: "root",
                    identity: {
                        id: "myIdentityId"
                    }
                }
            }),
            createMockLambdaContext()
        );

        expect(disconnectResult).toEqual({
            statusCode: 200
        });

        const connectionsAfterDisconnect = await context.sockets.listConnections({
            id: "myIdentityId"
        });
        expect(connectionsAfterDisconnect).toHaveLength(0);
    });

    it("should run handler with the given event - disconnect route - error status due to no existing connection", async () => {
        const handler = createHandler({
            plugins: createPlugins()
        });
        const contextHandler = useHandler();
        const context = await contextHandler.handle();

        const connectionsBeforeDisconnect = await context.sockets.listConnections({
            id: "myIdentityId"
        });
        expect(connectionsBeforeDisconnect).toHaveLength(0);

        const disconnectResult = await handler(
            createMockEvent({
                requestContext: {
                    routeKey: SocketsEventRoute.disconnect,
                    connectionId: "myConnectionId"
                },
                data: {
                    locale: "en-US",
                    tenant: "root",
                    identity: {
                        id: "myIdentityId"
                    }
                }
            }),
            createMockLambdaContext()
        );

        expect(disconnectResult).toEqual({
            error: {
                code: "CONNECTION_NOT_FOUND",
                data: {
                    PK: "WS#CONNECTIONS",
                    SK: "myConnectionId"
                },
                message: 'There is no connection with ID "myConnectionId".',
                stack: expect.any(String)
            },
            message: 'Route "$disconnect" action failed.',
            statusCode: 500
        });
    });
});
