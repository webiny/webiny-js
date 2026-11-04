import { describe, it, expect } from "vitest";
import { createHandler } from "~/fastify";
import { createRoute } from "~/plugins/RoutePlugin";

const createApp = () => {
    return createHandler({
        plugins: [
            createRoute(({ onPost }) => {
                onPost("/webiny-test", async (request, reply) => {
                    return reply.send({
                        body: request.body,
                        polluted: ({} as Record<string, unknown>)["polluted"] ?? null
                    });
                });
            })
        ]
    });
};

const post = async (payload: string) => {
    const app = createApp();
    return app.inject({
        path: "/webiny-test",
        method: "POST",
        headers: {
            "content-type": "application/json"
        },
        payload
    });
};

describe("JSON request body parsing", () => {
    it("should parse a valid JSON body", async () => {
        const result = await post(JSON.stringify({ query: "{ test }", nested: { value: 1 } }));

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual({
            body: { query: "{ test }", nested: { value: 1 } },
            polluted: null
        });
    });

    it.each([
        ["a top-level __proto__ key", '{"__proto__": {"polluted": true}}'],
        ["a nested __proto__ key", '{"a": {"__proto__": {"polluted": true}}}'],
        ["a constructor.prototype key", '{"constructor": {"prototype": {"polluted": true}}}']
    ])("should reject a body with %s with a 400", async (_, payload) => {
        const result = await post(payload);

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body)).toMatchObject({
            code: "Handler/InvalidRequestBody",
            message: "Invalid JSON request body."
        });
        expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
    });

    it("should reject malformed JSON with a 400", async () => {
        const result = await post("{ not json");

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body)).toMatchObject({
            code: "Handler/InvalidRequestBody"
        });
    });
});
