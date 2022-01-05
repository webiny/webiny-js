import { ContextPlugin, createHandler, HandlerPlugin } from "@webiny/handler";
import plugins from "~/index";
import { HttpContext } from "~/types";

describe("handler response", () => {
    it("should have http object attached to context", async () => {
        const ctx = {
            value: null
        };
        const contextPlugin = new ContextPlugin<HttpContext>(async context => {
            context.invocationArgs = {
                method: "POST",
                body: "",
                headers: {},
                cookies: {},
                path: {
                    base: "base",
                    parameters: {},
                    query: {}
                }
            };
        });
        const handlerPlugin = new HandlerPlugin(async context => {
            ctx.value = context;
            return {
                ok: true
            };
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
            ok: true
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
                method: "OPTIONS"
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
            statusCode: 200,
            headers: {
                "Cache-Control": "public, max-age=86400",
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "OPTIONS,POST",
                "Access-Control-Max-Age": "86400"
            }
        });
    });
});
