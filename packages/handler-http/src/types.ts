type ResponseArgs = {
    statusCode: number;
    headers?: {};
    body?: string;
};

export type HandlerHttpContextObject = {
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
};

export type HandlerHttpContext = {
    http: HandlerHttpContextObject;
};
