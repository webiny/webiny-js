import { ContextPlugin, createHandler, HandlerPlugin } from "@webiny/handler";
import plugins from "~/index";
import { HttpContext } from "~/types";

process.env.WEBINY_ENABLE_VERSION_HEADER = "true";

describe("handler response", () => {
    it("should have http object attached to context", async () => {
        const ctx: any = {
            value: null
        };
        const contextPlugin = new ContextPlugin<HttpContext>(async context => {
            context.invocationArgs = {
                method: "POST",
                body: "",
                headers: {},
                cookies: [],
                path: {
                    base: "base",
                    parameters: {},
                    query: {}
                }
            };
        });
        const handlerPlugin = new HandlerPlugin<HttpContext>(async context => {
            ctx.value = context;
            return context.http.response({
                body: JSON.stringify({
                    ok: true
                }),
                statusCode: 200,
                headers: {}
            });
        });

        const handler = createHandler(
            contextPlugin,
            handlerPlugin,
            plugins({
                debug: true
            })
        );

        const result = await handler();

        expect(result).toEqual({
            body: JSON.stringify({
                ok: true
            }),
            statusCode: 200,
            headers: {}
        });
        expect(ctx.value).toMatchObject({
            invocationArgs: {
                method: "POST",
                body: "",
                headers: {},
                cookies: {},
                path: {
                    base: "base",
                    parameters: {},
                    query: {}
                }
            },
            http: {
                request: {
                    method: "POST",
                    body: "",
                    headers: {},
                    cookies: {},
                    path: {
                        base: "base",
                        parameters: {},
                        query: {}
                    }
                },
                response: expect.any(Function)
            }
        });
    });

    it("should output proper options headers with caching", async () => {
        const context = new ContextPlugin<HttpContext>(async context => {
            context.invocationArgs = {
                method: "OPTIONS",
                body: JSON.stringify({}),
                headers: {},
                cookies: [],
                path: {
                    base: "/",
                    query: {},
                    parameters: {}
                }
            };
        });
        const handler = createHandler(
            context,
            plugins({
                debug: true
            })
        );

        const result = await handler();

        expect(result).toEqual({
            body: "",
            statusCode: 204,
            headers: {
                "Cache-Control": "public, max-age=86400",
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "OPTIONS,POST",
                "Access-Control-Max-Age": "86400",
                "x-webiny-version": expect.any(String)
            }
        });
    });
});
