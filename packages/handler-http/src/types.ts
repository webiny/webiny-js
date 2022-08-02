import { ArgsContext } from "@webiny/handler-args-old/types";

interface ResponseArgs {
    statusCode?: number;
    headers?: {};
    body?: string;
}

export interface HttpRequestObject {
    method: "POST" | "GET" | "PUT" | "DELETE" | "OPTIONS" | string;
    body: string;
    headers: { [key: string]: any };
    cookies: string[];
    path: {
        base: string;
        parameters: { [key: string]: any };
        query: { [key: string]: any };
    };
}

export interface HttpObject {
    response: (args: ResponseArgs) => { [key: string]: any };
    request: HttpRequestObject;
}

export interface HttpContext extends ArgsContext<HttpRequestObject> {
    http: HttpObject;
}

export interface HandlerHttpOptions {
    debug?: boolean;
}
