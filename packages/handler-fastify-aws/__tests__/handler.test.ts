import { createHandler } from "~/index";
import { createLambdaEvent } from "./mocks/lambdaEvent";
import { createLambdaContext } from "./mocks/lambdaContext";

describe("fastify aws handler", () => {
    it("should construct handler and be able to trigger it", async () => {
        const handler = createHandler({
            plugins: []
        });

        const result = await handler(createLambdaEvent(), createLambdaContext());

        expect(result).toMatchObject({
            body: JSON.stringify({
                message: "Route POST:/webiny not found",
                error: "Not Found",
                statusCode: 404
            }),
            isBase64Encoded: false,
            statusCode: 404
        });
    });
});
