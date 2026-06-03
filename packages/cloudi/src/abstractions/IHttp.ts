export interface IHttpRequest {
    method: string;
    path: string;
    headers: Record<string, string>;
    query: Record<string, string>;
    body: any;
}

export interface IHttpResponse {
    statusCode: number;
    headers?: Record<string, string>;
    body?: any;
}

export function isHttpRequest(event: any): event is IHttpRequest {
    return (
        typeof event === "object" &&
        event !== null &&
        typeof event.method === "string" &&
        typeof event.path === "string" &&
        typeof event.headers === "object" &&
        typeof event.query === "object"
    );
}
