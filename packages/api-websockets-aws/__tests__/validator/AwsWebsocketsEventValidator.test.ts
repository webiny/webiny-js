import { describe, it, expect } from "vitest";
import { AwsWebsocketsEventValidator } from "~/validator/AwsWebsocketsEventValidator.js";
import { WebsocketsEventRequestContextEventType, WebsocketsEventRoute } from "~/handler/types.js";

const connectedAt = new Date().getTime() / 1000;

describe("AwsWebsocketsEventValidator", () => {
    it("should pass the validation", async () => {
        const validator = new AwsWebsocketsEventValidator();

        const result = await validator.validate({
            requestContext: {
                stage: "dev",
                domainName: "localhost",
                eventType: WebsocketsEventRequestContextEventType.connect,
                routeKey: WebsocketsEventRoute.connect,
                connectionId: "123",
                connectedAt
            },
            body: JSON.stringify({
                token: "token",
                tenant: "tenant",
                messageId: "messageId",
                action: "action",
                data: {}
            })
        });

        expect(result).toEqual({
            headers: undefined,
            context: {
                connectionId: "123",
                connectedAt,
                host: "localhost",
                eventType: "connect",
                route: "connect",
                endpoint: "https://localhost/dev"
            },
            body: {
                token: "token",
                tenant: "tenant",
                messageId: "messageId",
                action: "action",
                data: {}
            }
        });
    });

    it("should pass the validation on connect and disconnect - without body", async () => {
        const validator = new AwsWebsocketsEventValidator();

        const resultConnect = await validator.validate({
            requestContext: {
                stage: "dev",
                domainName: "localhost",
                eventType: WebsocketsEventRequestContextEventType.connect,
                routeKey: WebsocketsEventRoute.connect,
                connectionId: "123",
                connectedAt
            },
            body: ""
        });

        expect(resultConnect).toEqual({
            headers: undefined,
            context: {
                connectionId: "123",
                connectedAt,
                host: "localhost",
                eventType: "connect",
                route: "connect",
                endpoint: "https://localhost/dev"
            },
            body: {}
        });

        const resultDisconnect = await validator.validate({
            requestContext: {
                stage: "dev",
                domainName: "localhost",
                eventType: WebsocketsEventRequestContextEventType.disconnect,
                routeKey: WebsocketsEventRoute.disconnect,
                connectionId: "123",
                connectedAt
            }
        });

        expect(resultDisconnect).toEqual({
            headers: undefined,
            context: {
                connectionId: "123",
                connectedAt,
                host: "localhost",
                eventType: "disconnect",
                route: "disconnect",
                endpoint: "https://localhost/dev"
            },
            body: {}
        });
    });

    it("should fail on body validation - wrong body type - null", async () => {
        expect.assertions(3);
        const validator = new AwsWebsocketsEventValidator();

        try {
            await validator.validate({
                requestContext: {
                    stage: "dev",
                    domainName: "localhost",
                    eventType: WebsocketsEventRequestContextEventType.connect,
                    routeKey: WebsocketsEventRoute.connect,
                    connectionId: "123",
                    connectedAt
                },
                body: null as unknown as string
            });
        } catch (ex) {
            expect(ex.message).toEqual("Validation failed.");
            expect(ex.code).toEqual("VALIDATION_FAILED_INVALID_FIELDS");
            expect(ex.data).toEqual({
                invalidFields: {
                    body: {
                        code: "invalid_type",
                        data: {
                            path: ["body"]
                        },
                        message: "Invalid input: expected string, received null"
                    }
                }
            });
        }
    });

    it("should fail on body validation - wrong body type - malformed string", async () => {
        expect.assertions(3);
        const validator = new AwsWebsocketsEventValidator();

        try {
            await validator.validate({
                requestContext: {
                    stage: "dev",
                    domainName: "localhost",
                    eventType: WebsocketsEventRequestContextEventType.connect,
                    routeKey: WebsocketsEventRoute.connect,
                    connectionId: "123",
                    connectedAt
                },
                body: " something that will fail"
            });
        } catch (ex) {
            expect(ex.message).toEqual("Validation failed.");
            expect(ex.code).toEqual("VALIDATION_FAILED_INVALID_FIELDS");
            expect(ex.data).toEqual({
                invalidFields: {
                    body: {
                        code: "custom",
                        data: {
                            path: ["body"]
                        },
                        message: expect.stringContaining("Invalid JSON: Unexpected token")
                    }
                }
            });
        }
    });

    it("should fail on body validation - no body sent", async () => {
        expect.assertions(3);
        const validator = new AwsWebsocketsEventValidator();

        try {
            await validator.validate({
                requestContext: {
                    stage: "dev",
                    domainName: "localhost",
                    eventType: WebsocketsEventRequestContextEventType.message,
                    routeKey: "$message",
                    connectionId: "123",
                    connectedAt
                }
            });
        } catch (ex) {
            expect(ex.message).toEqual("Validation failed.");
            expect(ex.code).toEqual("VALIDATION_FAILED_INVALID_FIELDS");
            expect(ex.data).toEqual({
                invalidFields: {
                    body: {
                        code: "custom",
                        data: {
                            path: ["body"]
                        },
                        message: "There must be a body defined when having a message event."
                    }
                }
            });
        }
    });

    it("should fail on body validation - wrong body.data type", async () => {
        expect.assertions(3);
        const validator = new AwsWebsocketsEventValidator();

        try {
            await validator.validate({
                requestContext: {
                    stage: "dev",
                    domainName: "localhost",
                    eventType: WebsocketsEventRequestContextEventType.connect,
                    routeKey: WebsocketsEventRoute.connect,
                    connectionId: "123",
                    connectedAt
                },
                body: JSON.stringify({
                    token: "token",
                    tenant: "tenant",
                    messageId: "messageId",
                    action: "action",
                    data: "not an object"
                })
            });
        } catch (ex) {
            expect(ex.message).toEqual("Validation failed.");
            expect(ex.code).toEqual("VALIDATION_FAILED_INVALID_FIELDS");
            expect(ex.data).toEqual({
                invalidFields: {
                    data: {
                        code: "invalid_type",
                        data: {
                            path: ["data"]
                        },
                        message: "Invalid input: expected object, received string"
                    }
                }
            });
        }
    });
});
