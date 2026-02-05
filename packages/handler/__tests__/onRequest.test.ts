import { describe, expect, it } from "vitest";
import { createHandler } from "~/fastify";
import { createRoute } from "~/plugins/RoutePlugin";
import { createHandlerOnRequest } from "~/plugins/HandlerOnRequestPlugin";

const createRoutes = () => {
    return createRoute(({ onPost, onOptions }) => {
        onPost("/webiny-test", async (_, reply) => {
            return reply.send({
                weGotToPostReply: true
            });
        });
        onOptions("/webiny-test", async (_, reply) => {
            return reply.send({
                weGotToOptionsReply: true
            });
        });
    });
};

describe("fastify onRequest event", { timeout: 5000 }, () => {
    it("should return our built-in headers when sending options request", async () => {
        const app = createHandler({
            plugins: [createRoutes()]
        });

        const optionsResult = await app.inject({
            path: "/webiny-test",
            method: "OPTIONS",
            query: {},
            headers: {
                "content-type": "application/json"
            }
        });

        expect(optionsResult).toMatchObject({
            statusCode: 204,
            cookies: [],
            headers: {
                "cache-control": "public, max-age=86400",
                "access-control-allow-origin": "*",
                "access-control-allow-headers": "*",
                "access-control-allow-methods": "OPTIONS,POST",
                "access-control-max-age": "86400",
                connection: "keep-alive",
                date: expect.toBeDateString()
            },
            body: "",
            payload: ""
        });

        const postResult = await app.inject({
            path: "/webiny-test",
            method: "POST",
            query: {},
            headers: {
                "content-type": "application/json"
            },
            payload: JSON.stringify({})
        });

        expect(postResult).toMatchObject({
            statusCode: 200,
            cookies: [],
            headers: {
                "cache-control": "no-store",
                "content-type": "application/json; charset=utf-8",
                "access-control-allow-origin": "*",
                "access-control-allow-headers": "*",
                "access-control-allow-methods": "OPTIONS,POST",
                connection: "keep-alive",
                date: expect.toBeDateString()
            },
            body: JSON.stringify({ weGotToPostReply: true }),
            payload: JSON.stringify({ weGotToPostReply: true })
        });
    });

    it("should return users headers set via the plugin", async () => {
        const app = createHandler({
            plugins: [
                createRoutes(),
                createHandlerOnRequest(async (request, reply) => {
                    const raw = reply.code(205).hijack().raw;

                    raw.setHeader("user-set-header", "true");
                    raw.end(JSON.stringify({ usersPlugin: true }));

                    return false;
                })
            ]
        });

        const result = await app.inject({
            path: "/webiny-test",
            method: "OPTIONS",
            query: {}
        });

        expect(result).toMatchObject({
            statusCode: 205,
            cookies: [],
            headers: {
                "user-set-header": "true",
                connection: "keep-alive",
                "transfer-encoding": "chunked"
            },
            body: JSON.stringify({ usersPlugin: true }),
            payload: JSON.stringify({ usersPlugin: true })
        });
    });

    it("should throw a log if user did not end onRequest plugin correctly", async () => {
        const app = createHandler({
            plugins: [
                createRoutes(),
                createHandlerOnRequest(async (request, reply) => {
                    const raw = reply.code(205).hijack().raw;

                    raw.setHeader("user-set-header", "true");
                    raw.end(JSON.stringify({ usersPlugin: true }));
                })
            ]
        });

        const log = console.error;
        /**
         * This way we can check if the log, which should not be sent, was sent.
         */
        let logged = false;

        console.error = values => {
            if (typeof values === "string") {
                try {
                    const obj = JSON.parse(values);
                    if (obj?.message && obj?.explanation) {
                        logged = true;
                        return;
                    }
                } catch {}
            }
            log(values);
        };

        const result = await app.inject({
            path: "/webiny-test",
            method: "OPTIONS",
            query: {}
        });

        expect(logged).toEqual(true);

        expect(result).toMatchObject({
            statusCode: 205,
            cookies: [],
            headers: {
                "user-set-header": "true",
                connection: "keep-alive",
                "transfer-encoding": "chunked"
            },
            body: JSON.stringify({ usersPlugin: true }),
            payload: JSON.stringify({ usersPlugin: true })
        });
    });
});
