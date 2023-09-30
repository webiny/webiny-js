import { ContextPlugin, createBeforeHandlerPlugin } from "@webiny/handler";
import { createHandlerOnRequest } from "@webiny/handler";
import { createApiGatewayRoute } from "@webiny/handler-aws";
import { SecurityContext } from "@webiny/api-security/types";
import { Context } from "~/types";

// TODO: these headers MUST be configurable
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
            reply
                .headers({
                    "Access-Control-Max-Age": "86400",
                    // "Cache-Control": "public, max-age=86400",
                    "Cache-Control": "no-store",
                    "Content-Type": "application/json; charset=utf-8",
                    "Access-Control-Allow-Origin": domain,
                    "Access-Control-Allow-Methods": "OPTIONS,POST,GET,DELETE,PUT,PATCH",
                    "Access-Control-Allow-Headers": whitelistedHeaders.join(", "),
                    "Access-Control-Allow-Credentials": true
                })
                .code(204)
                .send("")
                .hijack();
            return false;
        } else {
            reply.header("Access-Control-Allow-Credentials", true);
            reply.header("Access-Control-Allow-Origin", domain);
            reply.header("X-Tenant", "root");
            reply.header("Vary", "Origin");
        }
        return undefined;
    });
};

export const createPrivateFiles = () => {
    return [
        createBeforeHandlerPlugin<Context>(async context => {
            const { cookies } = context.request;
            const token = cookies["wby-id-token"];

            if (!context.security.getIdentity() && token) {
                try {
                    await context.security.authenticate(token);
                } catch (err) {
                    console.log(err);
                }
            }
        }),
        createApiGatewayRoute<Context>(({ onGet, context }) => {
            onGet("/_internal/fm-can-access-file", async (request, reply) => {
                const { security, fileManager } = context;
                const identity = security.getIdentity();

                const { fileKey } = request.query as Record<string, string | null>;

                if (!fileKey) {
                    return reply.code(400).send({ code: "MISSING_FILE_KEY_IN_QUERY_PARAMS" });
                }

                const file = await security.withoutAuthorization(async () => {
                    try {
                        const [files] = await fileManager.listFiles({
                            where: { key: fileKey },
                            limit: 1
                        });

                        return files[0];
                    } catch {
                        return null;
                    }
                });

                if (!file) {
                    return reply.code(404).send({ code: "FILE_NOT_FOUND" });
                }

                // For the PoC, we just check if file is tagged with "private".
                const isPrivate = file.tags.includes("private");

                return reply.send({
                    canAccess: isPrivate ? identity !== undefined : true,
                    isPrivate,
                    file: {
                        id: file.id,
                        name: file.name,
                        key: file.key,
                        tags: file.tags
                    }
                });
            });
        }),
        new ContextPlugin<SecurityContext>(context => {
            context.security.onLogin.subscribe(() => {
                const currentDate = new Date();

                const token = context.security.getToken();

                if (!token) {
                    return;
                }

                // TODO: this should be extracted from the idToken (`exp` claim).
                // TODO: For API Keys, we don't want to set the cookie at all.
                const hours = 1000 * 60 * 60 * 24;
                const expiresOn = new Date(currentDate.getTime() + hours);

                // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie
                // `https` requirement is ignored for `localhost`, so it is safe to set `secure: true`.
                context.reply.setCookie("wby-id-token", token, {
                    path: "/",
                    expires: expiresOn,
                    // Allow this cookie to be sent with cross-origin requests.
                    sameSite: "none",
                    // Only send this cookie to the server when HTTPS is used.
                    secure: true,
                    // Forbids JavaScript from accessing the cookie.
                    httpOnly: true
                });
            });
        })
    ];
};
