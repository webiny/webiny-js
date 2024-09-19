import { WebsocketsEventValidator } from "~/validator/WebsocketsEventValidator";
import { WebsocketsEventRequestContextEventType } from "~/handler/types";

const connectedAt = new Date().getTime() / 1000;

describe("WebsocketsEventValidator", () => {
    it("should pass the validation", async () => {
        const validator = new WebsocketsEventValidator();

        const result = await validator.validate({
            requestContext: {
                stage: "dev",
                domainName: "localhost",
                eventType: WebsocketsEventRequestContextEventType.connect,
                routeKey: "$connect",
                connectionId: "123",
                connectedAt
            },
            body: JSON.stringify({
                token: "token",
                tenant: "tenant",
                locale: "locale",
                messageId: "messageId",
                action: "action",
                data: {}
            })
        });

        expect(result).toEqual({
            requestContext: {
                stage: "dev",
                domainName: "localhost",
                eventType: WebsocketsEventRequestContextEventType.connect,
                routeKey: "$connect",
                connectionId: "123",
                connectedAt
            },
            body: {
                token: "token",
                tenant: "tenant",
                locale: "locale",
                messageId: "messageId",
                action: "action",
                data: {}
            }
        });
    });

    it("should pass the validation on connect and disconnect - without body", async () => {
        const validator = new WebsocketsEventValidator();

        const resultConnect = await validator.validate({
            requestContext: {
                stage: "dev",
                domainName: "localhost",
                eventType: WebsocketsEventRequestContextEventType.connect,
                routeKey: "$connect",
                connectionId: "123",
                connectedAt
            },
            body: ""
        });

        expect(resultConnect).toEqual({
            requestContext: {
                stage: "dev",
                domainName: "localhost",
                eventType: WebsocketsEventRequestContextEventType.connect,
                routeKey: "$connect",
                connectionId: "123",
                connectedAt
            },
            body: {}
        });

        const resultDisconnect = await validator.validate({
            requestContext: {
                stage: "dev",
                domainName: "localhost",
                eventType: WebsocketsEventRequestContextEventType.disconnect,
                routeKey: "$disconnect",
                connectionId: "123",
                connectedAt
            }
        });

        expect(resultDisconnect).toEqual({
            requestContext: {
                stage: "dev",
                domainName: "localhost",
                eventType: WebsocketsEventRequestContextEventType.disconnect,
                routeKey: "$disconnect",
                connectionId: "123",
                connectedAt
            },
            body: {}
        });
    });

    it("should fail on body validation - wrong body type - null", async () => {
        expect.assertions(3);
        const validator = new WebsocketsEventValidator();

        try {
            await validator.validate({
                requestContext: {
                    stage: "dev",
                    domainName: "localhost",
                    eventType: WebsocketsEventRequestContextEventType.connect,
                    routeKey: "$connect",
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
                            fatal: undefined,
                            path: ["body"]
                        },
                        message: "Expected string, received null"
                    }
                }
            });
        }
    });

    it("should fail on body validation - wrong body type - malformed string", async () => {
        expect.assertions(3);
        const validator = new WebsocketsEventValidator();

        try {
            await validator.validate({
                requestContext: {
                    stage: "dev",
                    domainName: "localhost",
                    eventType: WebsocketsEventRequestContextEventType.connect,
                    routeKey: "$connect",
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
                            fatal: true,
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
        const validator = new WebsocketsEventValidator();

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
                            fatal: true,
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
        const validator = new WebsocketsEventValidator();

        try {
            await validator.validate({
                requestContext: {
                    stage: "dev",
                    domainName: "localhost",
                    eventType: WebsocketsEventRequestContextEventType.connect,
                    routeKey: "$connect",
                    connectionId: "123",
                    connectedAt
                },
                body: JSON.stringify({
                    token: "token",
                    tenant: "tenant",
                    locale: "locale",
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
                            fatal: undefined,
                            path: ["data"]
                        },
                        message: "Expected object, received string"
                    }
                }
            });
        }
    });
});
