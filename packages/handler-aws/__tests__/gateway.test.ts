import { createHandler, RoutePlugin } from "~/index";
import { createLambdaContext } from "./mocks/lambdaContext";
import { createLambdaEvent } from "./mocks/lambdaEvent";

describe("api gateway", () => {
    it("should create handler", async () => {
        const handler = createHandler({
            plugins: []
        });

        expect(handler).not.toBeNull();
        expect(typeof handler).toEqual("function");
    });

    it("should call handler and get an error for non-existing route", async () => {
        const handler = createHandler({
            plugins: []
        });

        let error: any;
        try {
            await handler(createLambdaEvent(), createLambdaContext());
        } catch (ex) {
            error = ex;
        }

        expect(error.message).toEqual(
            "To run @webiny/handler-aws/gateway, you must have at least one RoutePlugin set."
        );
    });

    it("should call handler and trigger given route", async () => {
        const handler = createHandler({
            plugins: [
                new RoutePlugin(({ onPost }) => {
                    onPost("/webiny", async (_, reply) => {
                        return reply.send({
                            test: true
                        });
                    });
                })
            ]
        });

        const result = await handler(createLambdaEvent(), createLambdaContext());

        expect(result).toEqual({
            body: JSON.stringify({ test: true }),
            headers: expect.any(Object),
            isBase64Encoded: false,
            statusCode: 200
        });
    });
});
