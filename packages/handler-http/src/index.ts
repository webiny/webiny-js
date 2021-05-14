import { HttpContext } from "./types";
import { ContextPlugin, HandlerErrorPlugin } from "@webiny/handler/types";

const DEFAULT_HEADERS = {
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST"
};

export default () => [
    {
        type: "context",
        apply(context) {
            const { invocationArgs } = context;
            if (!invocationArgs || !invocationArgs.method) {
                return;
            }

            const path = invocationArgs.path ?? {};

            const request = {
                method: invocationArgs.method,
                body: invocationArgs.body,
                headers: invocationArgs.headers,
                cookies: invocationArgs.cookies,
                path: {
                    base: path.base,
                    parameters: path.parameters,
                    query: path.query
                }
            };

            context.http = {
                request,
                response({ statusCode = 200, body = "", headers = {} }) {
                    return {
                        statusCode,
                        body,
                        headers
                    };
                }
            };
        }
    } as ContextPlugin<HttpContext>,
    {
        type: "handler-error",
        handle: (context, error) => {
            if (!context.http || typeof context.http.response !== "function") {
                return error;
            }

            return context.http.response({
                statusCode: 500,
                body: JSON.stringify({
                    error: {
                        name: error.constructor.name,
                        message: error.message,
                        stack: error.stack
                    }
                }),
                headers: DEFAULT_HEADERS
            });
        }
    } as HandlerErrorPlugin<HttpContext>
];
