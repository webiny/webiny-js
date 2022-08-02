import { HttpContext, HandlerHttpOptions } from "./types";
import { HandlerErrorPlugin, ContextPlugin } from "@webiny/handler-old";
import { boolean } from "boolean";
import { getWebinyVersionHeaders } from "@webiny/utils";
import { Plugin } from "@webiny/plugins";

const DEFAULT_HEADERS: Record<string, string> = {
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST",
    ...getWebinyVersionHeaders()
};

const OPTIONS_HEADERS: Record<string, string> = {
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "public, max-age=86400"
};

const OPTION_STATUS_CODE = 204;

const lowercaseKeys = (obj: Record<string, string>) => {
    return Object.keys(obj).reduce((acc, key) => {
        acc[key.toLowerCase()] = obj[key];
        return acc;
    }, {} as Record<string, string>);
};

export default (options: HandlerHttpOptions = {}): Plugin[] => [
    new ContextPlugin<HttpContext>(async context => {
        const { invocationArgs } = context;
        if (!invocationArgs || !invocationArgs.method) {
            return;
        }

        if (invocationArgs.method.toLowerCase() === "options") {
            context.setResult({
                statusCode: OPTION_STATUS_CODE,
                body: "",
                headers: {
                    ...DEFAULT_HEADERS,
                    ...OPTIONS_HEADERS
                }
            });
            return;
        }

        const path = invocationArgs.path ?? {
            base: "",
            parameters: {},
            query: ""
        };

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
    new HandlerErrorPlugin<HttpContext>(async (context, error) => {
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
    })
];
