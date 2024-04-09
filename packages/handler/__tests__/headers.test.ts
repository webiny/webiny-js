import { ResponseHeaders } from "~/ResponseHeaders";
import { createHandler } from "~/fastify";
import { createRoute } from "~/plugins/RoutePlugin";
import { createModifyResponseHeaders } from "~/plugins/ModifyResponseHeadersPlugin";

const createOptionsRoute = () => {
    return createRoute(({ onOptions }) => {
        onOptions("/webiny-test", async (_, reply) => {
            return reply.send({
                weGotToOptionsReply: true
            });
        });
    });
};

describe("ResponseHeaders class", () => {
    it("should provide a type safe way of modifying headers", async () => {
        const headers = ResponseHeaders.create();

        headers.set("access-control-allow-headers", value => {
            return [value, "x-wby-custom", "x-tenant", "x-i18n-locale"].filter(Boolean).join(",");
        });

        headers.set("x-webiny-version", value => value);

        expect(headers.getHeaders()).toEqual({
            "access-control-allow-headers": "x-wby-custom,x-tenant,x-i18n-locale",
            "x-tenant": undefined
        });
    });

    it("should provide a way to modify response headers through plugins", async () => {
        const app = createHandler({
            plugins: [
                createOptionsRoute(),
                createModifyResponseHeaders((_, headers) => {
                    headers.set(
                        "access-control-allow-methods",
                        () => "OPTIONS,POST,GET,DELETE,PUT,PATCH"
                    );
                }),
                createModifyResponseHeaders((_, headers) => {
                    headers.set("x-custom", "custom-header");
                    headers.set("cache-control", "public, max-age=86400");
                    headers.set("access-control-max-age", "86400");
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
            statusCode: 204,
            cookies: [],
            headers: {
                "cache-control": "public, max-age=86400",
                "content-type": "application/json; charset=utf-8",
                "access-control-allow-origin": "*",
                "access-control-allow-headers": "*",
                "access-control-allow-methods": "OPTIONS,POST,GET,DELETE,PUT,PATCH",
                "access-control-max-age": "86400",
                connection: "keep-alive",
                "x-custom": "custom-header"
            },
            body: "",
            payload: ""
        });
    });
});
