import { createHandler } from "~/index";
import { createLambdaEvent } from "./mocks/lambdaEvent";
import { RoutePlugin } from "@webiny/handler-fastify";
import { createLambdaContext } from "./mocks/lambdaContext";

const message = "It seems that reply is working.";

describe("fastify aws handler routes", () => {
    it("should register the route /webiny and trigger it on event", async () => {
        const handler = createHandler({
            plugins: [
                new RoutePlugin(async ({ onPost }) => {
                    onPost("/webiny", async (_, reply) => {
                        reply.send({
                            message
                        });
                    });
                })
            ]
        });

        const result = await handler(createLambdaEvent(), createLambdaContext());

        const body = JSON.stringify({
            message
        });
        expect(result).toEqual({
            body,
            headers: {
                connection: "keep-alive",
                "content-length": `${body.length}`,
                "content-type": "application/json; charset=utf-8",
                date: expect.any(String)
            },
            isBase64Encoded: false,
            statusCode: 200
        });
    });

    const cmsManageBody = {
        message: "Triggered CMS.",
        type: "manage",
        locale: "en-US"
    };

    const cmsReadBody = {
        message: "Triggered CMS.",
        type: "read",
        locale: "de"
    };
    const routePlugin = new RoutePlugin(async ({ onPost, onGet, onOptions }) => {
        onPost("/cms/:type(^manage|preview|read$)/:locale", async (request, reply) => {
            const params = request.params as Record<string, any>;
            if (params.type === "read") {
                reply.send(cmsReadBody);
                return;
            } else if (params.type === "manage") {
                reply.send(cmsManageBody);
                return;
            }
            reply.send({
                message: "ERROR!"
            });
        });

        onGet("/graphql", async (_, reply) => {
            reply.send({
                graphql: "get"
            });
        });

        onOptions("/graphql", async (_, reply) => {
            reply.send({
                options: true
            });
        });
    });

    it("should trigger cms manage route", async () => {
        const handler = createHandler({
            plugins: [routePlugin]
        });

        const cmsManageResult = await handler(
            createLambdaEvent({
                path: "/cms/manage/en-US"
            }),
            createLambdaContext()
        );

        expect(cmsManageResult).toMatchObject({
            body: JSON.stringify(cmsManageBody),
            headers: expect.any(Object)
        });
    });

    it("should trigger cms read route", async () => {
        const handler = createHandler({
            plugins: [routePlugin]
        });

        const cmsReadResult = await handler(
            createLambdaEvent({
                path: "/cms/read/de"
            }),
            createLambdaContext()
        );

        expect(cmsReadResult).toMatchObject({
            body: JSON.stringify(cmsReadBody),
            headers: expect.any(Object)
        });
    });

    it("should trigger graphql get route", async () => {
        const handler = createHandler({
            plugins: [routePlugin]
        });

        const result = await handler(
            createLambdaEvent({
                path: "/graphql",
                httpMethod: "GET"
            }),
            createLambdaContext()
        );

        expect(result).toMatchObject({
            body: JSON.stringify({
                graphql: "get"
            }),
            headers: expect.any(Object)
        });
    });

    it("should trigger graphql options route", async () => {
        const handler = createHandler({
            plugins: [routePlugin]
        });

        const result = await handler(
            createLambdaEvent({
                path: "/graphql",
                httpMethod: "OPTIONS"
            }),
            createLambdaContext()
        );

        expect(result).toMatchObject({
            body: JSON.stringify({
                options: true
            }),
            headers: expect.any(Object)
        });
    });
});
