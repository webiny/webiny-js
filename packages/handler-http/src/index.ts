import { HttpContext, HandlerHttpOptions } from "./types";
import { HandlerErrorPlugin } from "@webiny/handler/types";
import { boolean } from "boolean";
import { getWebinyVersionHeaders } from "@webiny/utils";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";

const DEFAULT_HEADERS = {
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST",
    ...getWebinyVersionHeaders()
};

const lowercaseKeys = obj => {
    return Object.keys(obj).reduce((acc, key) => {
        acc[key.toLowerCase()] = obj[key];
        return acc;
    }, {});
};

export default (options: HandlerHttpOptions = {}) => [
    new ContextPlugin<HttpContext>(async context => {
        const { invocationArgs } = context;
        if (!invocationArgs || !invocationArgs.method) {
            return;
        }

        if (invocationArgs.method.toLowerCase() === "options") {
            context.setAbort({
                statusCode: 204,
                body: "",
                headers: DEFAULT_HEADERS
            });
            return;
        }

        const path = invocationArgs.path ?? {};

        const request = {
            method: invocationArgs.method,
            body: invocationArgs.body,
            headers: lowercaseKeys(invocationArgs.headers || {}),
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
    }),
    {
        type: "handler-error",
        handle: (context, error) => {
            if (!context.http || typeof context.http.response !== "function") {
                return error;
            }
            const debug = boolean(options.debug);

            if (debug) {
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

            return context.http.response({
                statusCode: 500,
                body: JSON.stringify({
                    error: {
                        name: "Error",
                        message: "Internal Server Error"
                    }
                }),
                headers: DEFAULT_HEADERS
            });
        }
    } as HandlerErrorPlugin<HttpContext>
];
