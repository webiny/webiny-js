import { SocketsRunner } from "~/runner";
import { useHandler } from "~tests/helpers/useHandler";
import { SocketsEventValidator } from "~/validator";
import { MockSocketsEventValidator } from "~tests/mocks/MockSocketsEventValidator";
import { SocketsContext } from "~/context";
import { MockSocketsTransporter } from "~tests/mocks/MockSocketsTransporter";
import { SocketsEventRoute } from "~/handler/types";
import { createSocketsRoutePlugin } from "~/plugins";
import { SocketsResponse } from "~/response";

describe("sockets runner", () => {
    it("should run and fail the validation", async () => {
        const handler = useHandler();

        const context = await handler.handle();
        const registry = context.sockets.registry;
        const validator = new SocketsEventValidator();
        const response = new SocketsResponse();

        const runner = new SocketsRunner(context, registry, validator, response);

        const resultRootLevel = await runner.run({});

        expect(resultRootLevel).toEqual({
            statusCode: 500,
            message: "Validation failed.",
            error: {
                message: "Validation failed.",
                code: "VALIDATION_FAILED_INVALID_FIELDS",
                data: {
                    invalidFields: {
                        requestContext: {
                            code: "invalid_type",
                            message: "Required",
                            data: {
                                path: ["requestContext"]
                            }
                        },
                        data: {
                            code: "invalid_type",
                            message: "Required",
                            data: {
                                path: ["data"]
                            }
                        }
                    }
                },
                stack: expect.any(String)
            }
        });

        const resultFirstLevel = await runner.run({
            requestContext: {},
            data: {}
        });

        expect(resultFirstLevel).toEqual({
            error: {
                code: "VALIDATION_FAILED_INVALID_FIELDS",
                data: {
                    invalidFields: {
                        "requestContext.connectionId": {
                            code: "invalid_type",
                            message: "Required",
                            data: {
                                path: ["requestContext", "connectionId"]
                            }
                        },
                        "requestContext.connectedAt": {
                            code: "invalid_type",
                            message: "Required",
                            data: {
                                path: ["requestContext", "connectedAt"]
                            }
                        },
                        "requestContext.domainName": {
                            code: "invalid_type",
                            message: "Required",
                            data: {
                                path: ["requestContext", "domainName"]
                            }
                        },
                        "requestContext.eventType": {
                            code: "invalid_type",
                            message: "Required",
                            data: {
                                path: ["requestContext", "eventType"]
                            }
                        },
                        "requestContext.routeKey": {
                            code: "invalid_type",
                            message: "Required",
                            data: {
                                path: ["requestContext", "routeKey"]
                            }
                        },
                        "requestContext.requestId": {
                            code: "invalid_type",
                            message: "Required",
                            data: {
                                path: ["requestContext", "requestId"]
                            }
                        },
                        "requestContext.extendedRequestId": {
                            code: "invalid_type",
                            message: "Required",
                            data: {
                                path: ["requestContext", "extendedRequestId"]
                            }
                        },
                        "requestContext.apiId": {
                            code: "invalid_type",
                            message: "Required",
                            data: {
                                path: ["requestContext", "apiId"]
                            }
                        },
                        "requestContext.authorizer": {
                            code: "invalid_type",
                            message: "Required",
                            data: {
                                path: ["requestContext", "authorizer"]
                            }
                        },
                        "requestContext.error": {
                            code: "invalid_type",
                            message: "Required",
                            data: {
                                path: ["requestContext", "error"]
                            }
                        },
                        "requestContext.identity": {
                            code: "invalid_type",
                            message: "Required",
                            data: {
                                path: ["requestContext", "identity"]
                            }
                        },
                        "requestContext.requestTime": {
                            code: "invalid_type",
                            message: "Required",
                            data: {
                                path: ["requestContext", "requestTime"]
                            }
                        },
                        "requestContext.requestTimeEpoch": {
                            code: "invalid_type",
                            message: "Required",
                            data: {
                                path: ["requestContext", "requestTimeEpoch"]
                            }
                        },
                        "requestContext.stage": {
                            code: "invalid_type",
                            message: "Required",
                            data: {
                                path: ["requestContext", "stage"]
                            }
                        },
                        "requestContext.status": {
                            code: "invalid_type",
                            message: "Required",
                            data: {
                                path: ["requestContext", "status"]
                            }
                        },
                        "data.identity": {
                            code: "invalid_type",
                            message: "Required",
                            data: {
                                path: ["data", "identity"]
                            }
                        },
                        "data.tenant": {
                            code: "invalid_type",
                            message: "Required",
                            data: {
                                path: ["data", "tenant"]
                            }
                        },
                        "data.locale": {
                            code: "invalid_type",
                            message: "Required",
                            data: {
                                path: ["data", "locale"]
                            }
                        }
                    }
                },
                message: "Validation failed.",
                stack: expect.any(String)
            },
            message: "Validation failed.",
            statusCode: 500
        });
    });

    it("should run and fail the route action - missing route", async () => {
        const handler = useHandler();

        const context = await handler.handle();
        const registry = context.sockets.registry;
        const validator = new MockSocketsEventValidator();
        const response = new SocketsResponse();

        context.sockets = new SocketsContext(registry, new MockSocketsTransporter());

        const runner = new SocketsRunner(context, registry, validator, response);

        const result = await runner.run({
            requestContext: {
                routeKey: "aRouteKey"
            },
            data: {
                tenant: "root",
                locale: "en-US",
                identity: {
                    id: "id-1"
                }
            }
        });
        expect(result).toEqual({
            error: {
                code: "NO_ACTION_PLUGINS",
                data: {
                    action: "aRouteKey"
                },
                message: 'There are no action plugins for "aRouteKey"',
                stack: expect.any(String)
            },
            message: 'Route "aRouteKey" action failed.',
            statusCode: 500
        });
    });

    it("should run and return good status - default route", async () => {
        const handler = useHandler();

        const context = await handler.handle();
        const registry = context.sockets.registry;
        const validator = new MockSocketsEventValidator();
        const response = new SocketsResponse();

        context.sockets = new SocketsContext(registry, new MockSocketsTransporter());

        const runner = new SocketsRunner(context, registry, validator, response);

        const result = await runner.run({
            requestContext: {
                routeKey: SocketsEventRoute.default
            },
            data: {
                tenant: "root",
                locale: "en-US",
                identity: {
                    id: "id-1"
                }
            }
        });
        expect(result).toEqual({
            statusCode: 200
        });
    });

    it("should run and return good status - connect route", async () => {
        const handler = useHandler();

        const context = await handler.handle();
        const registry = context.sockets.registry;
        const validator = new MockSocketsEventValidator();
        const response = new SocketsResponse();

        context.sockets = new SocketsContext(registry, new MockSocketsTransporter());

        const runner = new SocketsRunner(context, registry, validator, response);

        const result = await runner.run({
            requestContext: {
                connectionId: "myConnectionIdAbcdefg",
                routeKey: SocketsEventRoute.connect
            },
            data: {
                tenant: "root",
                locale: "en-US",
                identity: {
                    id: "id-1"
                }
            }
        });
        expect(result).toEqual({
            statusCode: 200
        });
    });

    it("should run and return error status - disconnect route", async () => {
        const handler = useHandler();

        const context = await handler.handle();
        const registry = context.sockets.registry;
        const validator = new MockSocketsEventValidator();
        const response = new SocketsResponse();

        context.sockets = new SocketsContext(registry, new MockSocketsTransporter());

        const runner = new SocketsRunner(context, registry, validator, response);

        const result = await runner.run({
            requestContext: {
                connectionId: "myConnectionIdAbcdefg",
                routeKey: SocketsEventRoute.disconnect
            },
            data: {
                tenant: "root",
                locale: "en-US",
                identity: {
                    id: "id-1"
                }
            }
        });
        expect(result).toEqual({
            error: {
                code: "CONNECTION_NOT_FOUND",
                data: {
                    PK: "WS#CONNECTIONS",
                    SK: "myConnectionIdAbcdefg"
                },
                message: 'There is no connection with ID "myConnectionIdAbcdefg".',
                stack: expect.any(String)
            },
            message: 'Route "$disconnect" action failed.',
            statusCode: 500
        });
    });

    it("should run and return good status - disconnect route", async () => {
        const handler = useHandler();

        const context = await handler.handle();
        const registry = context.sockets.registry;
        const validator = new MockSocketsEventValidator();
        const response = new SocketsResponse();

        context.sockets = new SocketsContext(registry, new MockSocketsTransporter());

        const runner = new SocketsRunner(context, registry, validator, response);

        const beforeConnectConnectionsViaTenant = await registry.listViaTenant("root");
        expect(beforeConnectConnectionsViaTenant).toHaveLength(0);

        const beforeConnectConnectionsViaIdentity = await registry.listViaIdentity("id-1");
        expect(beforeConnectConnectionsViaIdentity).toHaveLength(0);

        const connectResult = await runner.run({
            requestContext: {
                connectionId: "myConnectionIdAbcdefg",
                routeKey: SocketsEventRoute.connect
            },
            data: {
                tenant: "root",
                locale: "en-US",
                identity: {
                    id: "id-1"
                }
            }
        });
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

        const afterConnectConnectionsViaIdentity = await registry.listViaIdentity("id-1");
        expect(afterConnectConnectionsViaIdentity).toHaveLength(1);
        expect(afterConnectConnectionsViaIdentity).toMatchObject([
            {
                connectionId: "myConnectionIdAbcdefg"
            }
        ]);

        const result = await runner.run({
            requestContext: {
                connectionId: "myConnectionIdAbcdefg",
                routeKey: SocketsEventRoute.disconnect
            },
            data: {
                tenant: "root",
                locale: "en-US",
                identity: {
                    id: "id-1"
                }
            }
        });
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
                createSocketsRoutePlugin("myCustomRouteKey", async ({ response }) => {
                    return response.ok();
                })
            ]
        });

        const context = await handler.handle();
        const registry = context.sockets.registry;
        const validator = new MockSocketsEventValidator();
        const response = new SocketsResponse();

        context.sockets = new SocketsContext(registry, new MockSocketsTransporter());

        const runner = new SocketsRunner(context, registry, validator, response);

        const result = await runner.run({
            requestContext: {
                routeKey: "myCustomRouteKey"
            },
            data: {
                tenant: "root",
                locale: "en-US",
                identity: {
                    id: "id-1"
                }
            }
        });
        expect(result).toEqual({
            statusCode: 200
        });
    });
});
