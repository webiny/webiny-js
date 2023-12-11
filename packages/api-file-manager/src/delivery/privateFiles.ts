import { createHandlerOnRequest, ResponseHeaders } from "@webiny/handler";

const whitelistedHeaders = [
    "accept",
    "authorization",
    "cache-control",
    "content-type",
    "x-i18n-Locale",
    "x-tenant",
    "x-apollo-tracing",
    "apollo-query-plan-experimental"
];

export const setupPrivateFiles = () => {
    return createHandlerOnRequest(async (request, reply) => {
        const isOptions = request.method === "OPTIONS";

        const domain = request.headers["origin"];

        const headers = ResponseHeaders.create();
        headers.set("access-control-allow-origin", domain);
        headers.set("access-control-allow-credentials", "true");

        if (isOptions) {
            // TODO: "Cache-Control": "public, max-age=86400",
            headers.set("cache-control", "no-store");
            headers.set("content-type", "application/json; charset=utf-8");
            headers.set("access-control-max-age", "86400");
            headers.set("access-control-allow-methods", "OPTIONS,POST,GET,DELETE,PUT,PATCH");
            headers.set("access-control-allow-headers", whitelistedHeaders.join(", "));
        } else {
            headers.set("x-tenant", request.headers["x-tenant"] || "root");
            headers.set("vary", "origin");
        }

        // TODO: add response modifier plugin processing
        reply.headers(headers.getHeaders());

        if (isOptions) {
            reply.code(204).send("").hijack();
            return false;
        }

        return undefined;
    });
};
