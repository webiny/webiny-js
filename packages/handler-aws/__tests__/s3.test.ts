import { createHandler, S3EventHandler } from "~/index";
import { createLambdaContext } from "./mocks/lambdaContext";
import { createS3Event } from "./mocks/s3Event";
import { S3Event } from "aws-lambda";

describe("s3", () => {
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
            await handler(createS3Event(), createLambdaContext());
        } catch (ex) {
            error = ex;
        }

        expect(error.message).toEqual(
            "To run @webiny/handler-aws/s3, you must have S3EventHandler set."
        );
    });

    it("should call handler and trigger given event - raw returned", async () => {
        const s3Event = createS3Event();
        const handler = createHandler({
            plugins: [
                new S3EventHandler<S3Event>(async ({ event }) => {
                    return event;
                })
            ]
        });

        const result = await handler(s3Event, createLambdaContext());

        expect(result).toEqual(createS3Event());
    });

    it("should call handler and trigger given event - reply returned", async () => {
        const s3Event = createS3Event();
        const handler = createHandler({
            plugins: [
                new S3EventHandler<S3Event>(async ({ event, reply }) => {
                    return reply.send(event);
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
