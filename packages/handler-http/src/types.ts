import { ArgsContext } from "@webiny/handler-args/types";
import { Context } from "@webiny/handler/types";

type ResponseArgs = {
    statusCode?: number;
    headers?: {};
    body?: string;
};

export type HttpRequestObject = {
    method: "POST" | "GET" | "PUT" | "DELETE" | "OPTIONS" | string;
    body: string;
    headers: { [key: string]: any };
    cookies: string[];
    path: {
        base: string;
        parameters: { [key: string]: any };
        query: { [key: string]: any };
    };
};

export type HttpObject = {
    response: (args: ResponseArgs) => { [key: string]: any };
    request: HttpRequestObject;
};

export interface HttpContext extends Context, ArgsContext {
    http: HttpObject;
}

export type HandlerHttpOptions = {
    debug?: boolean;
};
