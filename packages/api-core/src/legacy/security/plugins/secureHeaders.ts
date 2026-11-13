import { createHandlerOnRequest, ResponseHeaders } from "@webiny/handler";

const whitelistedHeaders = [
    "accept",
    "authorization",
    "cache-control",
    "content-type",
    "x-tenant",
    "x-apollo-tracing",
    "x-webiny-debug",
    "apollo-query-plan-experimental"
];

export const setupSecureHeaders = () => {
    return createHandlerOnRequest(async (request, reply) => {
        const isOptions = request.method === "OPTIONS";

        const headers = ResponseHeaders.create();
        /**
         * Private files are authenticated with the `wby-id-token` cookie. Their responses must not
         * be readable by other websites through a credentialed `fetch`, so they get a wildcard origin
         * without credentials. `<img src>`, links and plain `fetch` calls are not affected.
         */
        if (request.url.startsWith("/private/")) {
            headers.set("access-control-allow-origin", "*");
        } else {
            headers.set("access-control-allow-origin", request.headers["origin"]);
            headers.set("access-control-allow-credentials", "true");
        }

        if (isOptions) {
            headers.set("cache-control", "public, max-age=86400");
            headers.set("content-type", "application/json; charset=utf-8");
            headers.set("access-control-max-age", "86400");
            headers.set("access-control-allow-methods", "OPTIONS,POST,GET,DELETE,PUT,PATCH");
            headers.set("access-control-allow-headers", whitelistedHeaders.join(", "));
        } else {
            headers.set("x-tenant", request.headers["x-tenant"] || "root");
            headers.set("vary", "origin");
        }

        reply.headers(headers.getHeaders());
    });
};
