import { createHandler } from "~/handler/handler";
import { SocketsEventRoute } from "~/handler/types";
import { createMockLambdaContext } from "~tests/mocks/lambdaContext";
import { createPlugins } from "~tests/helpers/plugins";
import { createMockEvent } from "~tests/mocks/event";
import { useHandler } from "~tests/helpers/useHandler";

jest.mock("@webiny/aws-sdk/client-apigatewaymanagementapi", () => {
    return {
        ApiGatewayManagementApiClient: class ApiGatewayManagementApiClient {
            async send(cmd: any) {
                return cmd;
            }
        },
        PostToConnectionCommand: class PostToConnectionCommand {
            public readonly input: any;

            constructor(input: any) {
                this.input = input;
            }
        }
    };
});

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
                body: JSON.stringify({
                    messageId: "message123",
                    action: "mockAction",
                    token: "aToken",
                    locale: "en-US",
                    tenant: "root"
                })
            }),
            createMockLambdaContext()
        );

        expect(result).toMatchObject({
            statusCode: 200,
            isBase64Encoded: false,
            headers: {
                "sec-websocket-protocol": "webiny-ws-v1"
            },
            body: JSON.stringify({
                statusCode: 200
            })
        });
    });

    it("should run handler with the given event - connect route - ok status", async () => {
        const handler = createHandler({
            plugins: createPlugins()
        });
        const contextHandler = useHandler();
        const context = await contextHandler.handle();

        const connectionsBeforeConnect = await context.sockets.listConnections({
            id: "id-12345678"
        });
        expect(connectionsBeforeConnect).toHaveLength(0);

        const result = await handler(
            createMockEvent({
                requestContext: {
                    routeKey: SocketsEventRoute.connect,
                    connectionId: "myConnectionId"
                },
                body: JSON.stringify({
                    messageId: "message123",
                    action: "mockAction",
                    token: "aToken",
                    locale: "en-US",
                    tenant: "root"
                })
            }),
            createMockLambdaContext()
        );

        expect(result).toMatchObject({
            statusCode: 200,
            isBase64Encoded: false,
            headers: {
                "sec-websocket-protocol": "webiny-ws-v1"
            },
            body: JSON.stringify({
                statusCode: 200
            })
        });

        const connectionsAfterConnect = await context.sockets.listConnections({
            id: "id-12345678"
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
            id: "id-12345678"
        });
        expect(connectionsBeforeConnect).toHaveLength(0);

        const connectResult = await handler(
            createMockEvent({
                requestContext: {
                    routeKey: SocketsEventRoute.connect,
                    connectionId: "myConnectionId"
                },
                body: JSON.stringify({
                    messageId: "message123",
                    action: "mockAction",
                    token: "aToken",
                    locale: "en-US",
                    tenant: "root"
                })
            }),
            createMockLambdaContext()
        );

        expect(connectResult).toMatchObject({
            statusCode: 200,
            isBase64Encoded: false,
            headers: {
                "sec-websocket-protocol": "webiny-ws-v1"
            },
            body: JSON.stringify({
                statusCode: 200
            })
        });

        const connectionsAfterConnect = await context.sockets.listConnections({
            id: "id-12345678"
        });
        expect(connectionsAfterConnect).toHaveLength(1);

        const disconnectResult = await handler(
            createMockEvent({
                requestContext: {
                    routeKey: SocketsEventRoute.disconnect,
                    connectionId: "myConnectionId"
                },
                body: JSON.stringify({
                    messageId: "message123",
                    action: "mockAction",
                    token: "aToken",
                    locale: "en-US",
                    tenant: "root"
                })
            }),
            createMockLambdaContext()
        );

        expect(disconnectResult).toMatchObject({
            statusCode: 200,
            isBase64Encoded: false,
            headers: {
                "sec-websocket-protocol": "webiny-ws-v1"
            },
            body: JSON.stringify({
                statusCode: 200
            })
        });

        const connectionsAfterDisconnect = await context.sockets.listConnections({
            id: "id-12345678"
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
            id: "id-12345678"
        });
        expect(connectionsBeforeDisconnect).toHaveLength(0);

        const disconnectResult = await handler(
            createMockEvent({
                requestContext: {
                    routeKey: SocketsEventRoute.disconnect,
                    connectionId: "myConnectionId"
                },
                body: JSON.stringify({
                    messageId: "message123",
                    action: "mockAction",
                    token: "aToken",
                    locale: "en-US",
                    tenant: "root"
                })
            }),
            createMockLambdaContext()
        );

        expect(disconnectResult).toMatchObject({
            statusCode: 200,
            isBase64Encoded: false,
            headers: {
                "sec-websocket-protocol": "webiny-ws-v1"
            },
            body: expect.any(String)
        });
        const bodyResult = JSON.parse(disconnectResult.body);

        expect(bodyResult).toEqual({
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
            statusCode: 200
        });
    });
});
