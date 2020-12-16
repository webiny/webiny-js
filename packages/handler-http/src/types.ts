type ResponseArgs = {
    statusCode: number;
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
    method: "POST" | "GET" | "DELETE" | "OPTIONS";
    body: string;
    headers: { [key: string]: any };
    cookies: string[];
    path: {
        base: string;
        parameters: { [key: string]: any };
        query: { [key: string]: any };
    };
    response: (args: ResponseArgs) => { [key: string]: any };
    request: HttpRequestObject;
};

export type HttpContext = {
    http: HttpObject;
};
