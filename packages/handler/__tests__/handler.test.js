const { createHandler } = require("../src");

describe("handler test", () => {
    test("should return error response if no handlers returned a result", async () => {
        const handler = createHandler();
        const result = await handler();

        expect(result.statusCode).toBe(500);
        expect(JSON.parse(result.body).error.message).toBe("Handlers did not produce a result!");
    });

    test("should return a result from the first handler", async () => {
        const handler1 = {
            type: "handler",
            name: "handler-1",
            async handle() {
                return {
                    statusCode: 200,
                    body: "Success!"
                };
            }
        };

        const handler = createHandler(handler1);
        const result = await handler();

        expect(result.statusCode).toBe(200);
        expect(result.body).toBe("Success!");
    });

    test("should return a result from the second handler", async () => {
        const handler1 = {
            type: "handler",
            name: "handler-1",
            async handle(_, next) {
                next();
            }
        };

        const handler2 = {
            type: "handler",
            name: "handler-2",
            async handle() {
                return {
                    statusCode: 200,
                    body: "Handler 2"
                };
            }
        };

        const handler = createHandler(handler1, handler2);
        const result = await handler();

        expect(result.statusCode).toBe(200);
        expect(result.body).toBe("Handler 2");
    });

    test("should return an error response", async () => {
        const handler1 = {
            type: "handler",
            name: "handler-1",
            async handle() {
                throw Error("Something went wrong");
            }
        };

        const handler = createHandler(handler1);
        const result = await handler();

        expect(result.statusCode).toBe(500);
        expect(JSON.parse(result.body).error.message).toBe("Something went wrong");
    });

    test("should return a custom error response", async () => {
        const handler1 = {
            type: "error-handler",
            name: "error-handler-1",
            async handle({ error }) {
                return {
                    statusCode: 501,
                    errorCode: "CUSTOM_ERROR",
                    errorMessage: error.message
                };
            }
        };

        const handler = createHandler(handler1);
        const result = await handler();

        expect(result.statusCode).toBe(501);
        expect(result.errorCode).toBe("CUSTOM_ERROR");
        expect(result.errorMessage).toBe("Handlers did not produce a result!");
    });
});
