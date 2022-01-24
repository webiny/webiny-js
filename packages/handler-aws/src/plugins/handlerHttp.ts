import { HttpContext } from "@webiny/handler-http/types";
import { ContextPlugin } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";

const lowercaseKeys = (obj: Record<string, string>) => {
    return Object.keys(obj).reduce((acc, key) => {
        acc[key.toLowerCase()] = obj[key];
        return acc;
    }, {} as Record<string, string>);
};

export default {
    type: "context",
    apply(context) {
        const { invocationArgs } = context;
        if (!invocationArgs || !invocationArgs.httpMethod) {
            return;
        }

        const { isBase64Encoded } = invocationArgs;

        const request = {
            method: invocationArgs.httpMethod,
            body: invocationArgs.body,
            headers: lowercaseKeys(invocationArgs.headers || {}),
            cookies: invocationArgs.cookies,
            path: {
                base: invocationArgs.rawPath,
                parameters: invocationArgs.pathParameters,
                query: invocationArgs.queryStringParameters
            }
        };

        context.http = {
            request,
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
            context.http.request.body = Buffer.from(context.http.request.body, "base64").toString(
                "utf-8"
            );
        }
    }
} as ContextPlugin<HttpContext & ArgsContext>;
