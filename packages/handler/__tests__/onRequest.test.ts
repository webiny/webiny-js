import { createHandler } from "~/fastify";
import { createRoute } from "~/plugins/RoutePlugin";
import { createHandlerOnRequest } from "~/plugins/HandlerOnRequestPlugin";

const createOptionsRoute = () => {
    return createRoute(({ onOptions }) => {
        onOptions("/webiny-test", async (request, reply) => {
            return reply.send({
                weGotToOptionsReply: true
            });
        });
    });
};

describe("fastify onRequest event", () => {
    it("should return our built-in headers when sending options request", async () => {
        const app = createHandler({
            plugins: [createOptionsRoute()]
        });

        const result = await app.inject({
            path: "/webiny-test",
            method: "OPTIONS",
            query: {},
            payload: JSON.stringify({})
        });

        expect(result).toMatchObject({
            statusCode: 204,
            cookies: [],
            headers: {
                "cache-control": "public, max-age=86400",
                "content-type": "application/json; charset=utf-8",
                "access-control-allow-origin": "*",
                "access-control-allow-headers": "*",
                "access-control-allow-methods": "OPTIONS",
                "access-control-max-age": "86400",
                connection: "keep-alive"
            },
            body: "",
            payload: ""
        });
    });

    it("should return users headers set via the plugin", async () => {
        const app = createHandler({
            plugins: [
                createOptionsRoute(),
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
            query: {},
            payload: JSON.stringify({})
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
                createOptionsRoute(),
                createHandlerOnRequest(async (request, reply) => {
                    const raw = reply.code(205).hijack().raw;

                    raw.setHeader("user-set-header", "true");
                    raw.end(JSON.stringify({ usersPlugin: true }));
                })
            ]
        });

        const log = console.log;
        /**
         * This way we can check if the log, which should not be sent, was sent.
         */
        let logged = false;
        const target = JSON.stringify({
            message: `Output was already sent. Please check user defined the "HandlerOnRequestPlugin" for reply end.`,
            explanation:
                "This error can happen if users plugin ended the reply but did not return false as response."
        });
        console.log = values => {
            if (values === target) {
                logged = true;
            }
            log(values);
        };

        const result = await app.inject({
            path: "/webiny-test",
            method: "OPTIONS",
            query: {},
            payload: JSON.stringify({})
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
