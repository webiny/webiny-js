import { createHandler } from "~/raw";
import { EventPlugin } from "@webiny/handler";
import { LambdaContext } from "./types";

describe("raw", () => {
    it("should exec event and output should not be transformed into reply", async () => {
        const ev = new EventPlugin(async ({ payload }) => {
            return {
                ...payload,
                something: true
            };
        });
        const handler = createHandler({
            plugins: [ev]
        });

        const result = await handler(
            {
                input: 1
            },
            {} as LambdaContext
        );

        expect(result).toEqual({
            input: 1,
            something: true
        });
    });

    it("should exec event and output should be as reply object", async () => {
        const ev = new EventPlugin(async ({ payload, reply }) => {
            return reply.send({
                ...payload,
                something: true
            });
        });
        const handler = createHandler({
            plugins: [ev]
        });

        const result = await handler(
            {
                input: 1
            },
            {} as LambdaContext
        );

        expect(result).toMatchObject({
            body: JSON.stringify({
                input: 1,
                something: true
            })
        });
    });
});
