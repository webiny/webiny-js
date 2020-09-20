export type HttpRequestObject = {
    method: "POST" | "GET" | "DELETE" | "OPTIONS";
    body: string;
    headers: { [key: string]: any };
    cookies: string[];
    path: {
        base: string;
        parameters: { [key: string]: any };
        query: { [key: string]: any };
    };
};

export type HandlerHttpContext = {
    http: HttpRequestObject;
};
