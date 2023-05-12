import { createHandler } from "~/fastify";
import { createRoute } from "~/plugins/RoutePlugin";
import WebinyError from "@webiny/error";
import { createModifyFastifyPlugin } from "~/plugins/ModifyFastifyPlugin";

describe("custom error handler", () => {
    const data = {
        stringValue: "123",
        numberValue: 123,
        booleanValue: false,
        arrayValue: ["123", 123, false],
        objectValue: {
            testing: true,
            errorMessage: "not ok"
        }
    };

    it("should properly output error via built-in error handler", async () => {
        const app = createHandler({
            plugins: [
                createRoute(({ onAll }) => {
                    onAll("/webiny-test", async () => {
                        throw new WebinyError(
                            "Testing custom error handler output",
                            "CUSTOM_ERROR_HANDLER_CODE",
                            data
                        );
                    });
                })
            ]
        });

        const result = await app.inject({
            path: "/webiny-test",
            headers: {
                "content-type": "application/json"
            },
            method: "POST",
            payload: "{}"
        });

        const expected = JSON.stringify({
            message: "Testing custom error handler output",
            code: "CUSTOM_ERROR_HANDLER_CODE",
            data: {
                stringValue: "123",
                numberValue: 123,
                booleanValue: false,
                arrayValue: ["123", 123, false],
                objectValue: {
                    testing: true,
                    errorMessage: "not ok"
                }
            }
        });

        expect(result).toMatchObject({
            payload: expected,
            body: expected,
            statusCode: 500
        });
    });

    it("should properly output error via user defined error handler", async () => {
        const app = createHandler({
            plugins: [
                createModifyFastifyPlugin(instance => {
                    instance.setErrorHandler((error, request, reply) => {
                        return reply
                            .send({
                                justSimpleOutput: true
                            })
                            .code(404);
                    });
                }),
                createRoute(({ onAll }) => {
                    onAll("/webiny-test", async () => {
                        throw new WebinyError(
                            "Testing custom error handler output",
                            "CUSTOM_ERROR_HANDLER_CODE",
                            data
                        );
                    });
                })
            ]
        });

        const result = await app.inject({
            path: "/webiny-test",
            headers: {
                "content-type": "application/json"
            },
            method: "GET",
            payload: "{}"
        });

        const expected = JSON.stringify({
            justSimpleOutput: true
        });

        expect(result).toMatchObject({
            payload: expected,
            body: expected,
            statusCode: 404
        });
    });
});
