import { createS3Handler, S3EventHandler } from "~/index";
import { createLambdaContext } from "./mocks/lambdaContext";
import { createS3Event } from "./mocks/s3Event";
import { S3Event } from "aws-lambda";

describe("s3", () => {
    it("should create handler", async () => {
        const handler = createS3Handler({
            plugins: []
        });

        expect(handler).not.toBeNull();
        expect(typeof handler).toEqual("function");
    });

    it("should call handler and get an error for non-existing route", async () => {
        const handler = createS3Handler({
            plugins: []
        });

        let error: any;
        try {
            await handler(createS3Event(), createLambdaContext());
        } catch (ex) {
            error = ex;
        }

        expect(error.message).toEqual(
            "@webiny/handler-fastify-aws/s3 must have S3EventHandler set."
        );
    });

    it("should call handler and trigger given event", async () => {
        const s3Event = createS3Event();
        const handler = createS3Handler({
            plugins: [
                new S3EventHandler<S3Event>(async ({ event }) => {
                    return event;
                })
            ]
        });

        const result = await handler(s3Event, createLambdaContext());

        expect(result).toEqual({
            body: JSON.stringify(s3Event),
            headers: expect.any(Object),
            isBase64Encoded: false,
            statusCode: 200
        });
    });
});
