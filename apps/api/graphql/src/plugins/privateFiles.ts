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

export const createPrivateFilesFastifyPlugin = () => {
    return createHandlerOnRequest(async (request, reply) => {
        const domain = request.headers["origin"];

        if (request.method === "OPTIONS") {
            const headers = ResponseHeaders.create({
                // TODO: "Cache-Control": "public, max-age=86400",
                "Cache-Control": "no-store",
                "Content-Type": "application/json; charset=utf-8",
                "Access-Control-Max-Age": "86400",
                "Access-Control-Allow-Origin": domain,
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET,DELETE,PUT,PATCH",
                "Access-Control-Allow-Headers": whitelistedHeaders.join(", "),
                "Access-Control-Allow-Credentials": true
            });
            reply.headers().code(204).send("").hijack();
            return false;
        } else {
            const headers = ResponseHeaders.create();
            reply.header("Access-Control-Allow-Credentials", true);
            reply.header("Access-Control-Allow-Origin", domain);
            reply.header("X-Tenant", "root");
            reply.header("Vary", "Origin");
        }
        return undefined;
    });
};
