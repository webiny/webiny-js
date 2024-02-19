import { SocketsRunner } from "~/runner";
import { useHandler } from "~tests/helpers/useHandler";
import { SocketsEventValidator } from "~/validator";

describe("sockets runner", () => {
    it("should run and fail the validation", async () => {
        const handler = useHandler();

        const context = await handler.handle();
        const registry = context.sockets.registry;
        const validator = new SocketsEventValidator();

        const runner = new SocketsRunner(context, registry, validator);

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
});
