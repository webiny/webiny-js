import { ContextPlugin, createBeforeHandlerPlugin } from "@webiny/handler";
import { createHandlerOnRequest } from "@webiny/handler";
import { createApiGatewayRoute } from "@webiny/handler-aws";
import { SecurityContext } from "@webiny/api-security/types";
import { Context } from "~/types";

const whitelistedHeaders = ["Content-Type", "Cache-Control"];

export const createPrivateFilesFastifyPlugin = () => {
    return createHandlerOnRequest(async (request, reply) => {
        console.log("Request origin", request.headers);
        const domain = "https://d32dhcrku9nemu.cloudfront.net";
        if (request.method === "OPTIONS") {
            reply
                .headers({
                    "Access-Control-Max-Age": "86400",
                    // "Cache-Control": "public, max-age=86400",
                    "Cache-Control": "no-store",
                    "Content-Type": "application/json; charset=utf-8",
                    "Access-Control-Allow-Origin": domain,
                    "Access-Control-Allow-Methods": "OPTIONS,POST,GET,DELETE,PUT,PATCH",
                    "Access-Control-Allow-Headers": whitelistedHeaders.join(", ")
                })
                .code(204)
                .send("")
                .hijack();
            return false;
        } else {
            reply.header("Access-Control-Allow-Credentials", true);
            reply.header("Access-Control-Allow-Origin", domain);
            reply.header("Vary", "Origin");
        }
        return undefined;
    });
};

export const createPrivateFiles = () => {
    return [
        createBeforeHandlerPlugin<Context>(async context => {
            const { cookies } = context.request;

            console.log("cookies", JSON.stringify(cookies));

            // await context.authentication.authenticate(token);
        }),
        createApiGatewayRoute<Context>(({ onGet, context }) => {
            onGet("/_internal/fm-can-access-file", async (request, reply) => {
                const identity = context.security.getIdentity();

                return reply.send({
                    canAccess: true,
                    context: {
                        // @ts-ignore
                        file: await context.fileManager.getFile(request.query.fileId),
                        identity
                    }
                });
            });
        }),
        new ContextPlugin<SecurityContext>(context => {
            context.security.onLogin.subscribe(({ identity }) => {
                console.log("onLogin", JSON.stringify(identity));
                const currentDate = new Date();
                const hours = 1000 * 60 * 60 * 3;

                context.reply.setCookie("wby-identity", identity.id, {
                    domain: "d26watk6chcr2b.cloudfront.net",
                    path: "/",
                    expires: new Date(currentDate.getTime() + hours),
                    sameSite: "none",
                    // Only send this cookie to the server when HTTPS is used.
                    secure: true
                    // Forbids JavaScript from accessing the cookie.
                    // httpOnly: true
                });
            });
        })
    ];
};
