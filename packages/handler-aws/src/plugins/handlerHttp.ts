import { HttpContext } from "@webiny/handler-http/types";
import { ContextPlugin } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";

export default {
    type: "context",
    apply(context) {
        const { invocationArgs } = context;
        if (!invocationArgs.httpMethod) {
            return;
        }

        const { isBase64Encoded } = invocationArgs;

        context.http = {
            method: invocationArgs.httpMethod,
            body: invocationArgs.body,
            headers: invocationArgs.headers,
            cookies: invocationArgs.cookies,
            path: {
                base: invocationArgs.rawPath,
                parameters: invocationArgs.pathParameters,
                query: invocationArgs.queryStringParameters
            },
            response({ statusCode = 200, body = "", headers = {} }) {
                return {
                    statusCode,
                    body: isBase64Encoded ? Buffer.from(body).toString("base64") : body,
                    headers,
                    isBase64Encoded
                };
            }
        };

        if (isBase64Encoded) {
            context.http.body = Buffer.from(context.http.body, "base64").toString("utf-8");
        }
    }
} as ContextPlugin<HttpContext & ArgsContext>;
