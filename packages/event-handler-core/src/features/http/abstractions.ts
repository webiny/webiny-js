import { Abstraction } from "@webiny/di";

export interface IHttpRequest {
    method: string;
    path: string;
    headers: Record<string, string>;
    query: Record<string, string>;
    pathParameters: Record<string, string>;
    body: any;
}

export interface IHttpResponse {
    statusCode: number;
    headers?: Record<string, string>;
    /**
     * Serialized `Set-Cookie` values. A separate field (not a header) because `Set-Cookie` is the
     * one response header that can legally repeat, which `headers: Record<string, string>` cannot
     * express. Transports map it to whatever their protocol needs — API Gateway's
     * `multiValueHeaders` / `cookies`, or a repeated header on a Node `ServerResponse`.
     */
    cookies?: string[];
    body?: any;
}

export interface CookieOptions {
    domain?: string;
    path?: string;
    expires?: Date;
    /**
     * Cookie lifetime in SECONDS — the `Max-Age` attribute value as the HTTP spec defines it.
     * Note this differs from Express, whose `maxAge` is in milliseconds.
     */
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    partitioned?: boolean;
    sameSite?: "strict" | "lax" | "none";
}

/**
 * The mutable response handed to every route as the second argument to `handle()` — the `res` of
 * Express-style handlers. Every method returns `this`, so a route can chain and then return the
 * builder directly:
 *
 * ```ts
 * async handle(request: IHttpRequest, response: IHttpResponseBuilder) {
 *     return response.status(201).cookie("sid", id, { httpOnly: true }).json({ id });
 * }
 * ```
 *
 * Returning it is optional: a route that mutates it and returns nothing gets the same response.
 * Routes returning a plain {@link IHttpResponse} keep working — anything set on the builder
 * (headers, cookies) is merged underneath the returned object, which wins on conflicts.
 */
export interface IHttpResponseBuilder {
    /** Set the status code. Defaults to 200. */
    status(statusCode: number): this;
    /** Set a single response header (header names are stored lowercase). */
    header(name: string, value: string): this;
    /** Merge multiple response headers at once. */
    setHeaders(headers: Record<string, string>): this;
    getHeader(name: string): string | undefined;
    removeHeader(name: string): this;
    /**
     * Set `Content-Type`. Accepts a full media type (`"image/png"`) or one of the shorthands
     * `json`, `text`, `html`, `xml`, `bin`.
     */
    type(contentType: string): this;
    /** Append a `Set-Cookie` value. Can be called multiple times for multiple cookies. */
    cookie(name: string, value: string, options?: CookieOptions): this;
    /** Append a `Set-Cookie` value that expires the cookie immediately. */
    clearCookie(name: string, options?: Omit<CookieOptions, "expires" | "maxAge">): this;
    /** JSON-serialize the body and set `Content-Type: application/json` (unless already set). */
    json(body?: any): this;
    /**
     * Set the body, inferring `Content-Type` when it hasn't been set: `text/html` for a string,
     * `application/octet-stream` for a Buffer/Uint8Array, `application/json` for anything else.
     */
    send(body?: any): this;
    /** Set the body with `Content-Type: text/plain`. */
    text(body: string): this;
    /** Set the body with `Content-Type: text/html`. */
    html(body: string): this;
    /** Set `Location` and a redirect status code (302 by default). */
    redirect(url: string, statusCode?: number): this;
    /** Set the body verbatim, without touching `Content-Type`. */
    end(body?: any): this;
    /** Materialize the transport-agnostic response. Called by the router; routes rarely need it. */
    toResponse(): IHttpResponse;
}

export interface IHttpRoute {
    readonly method: string;
    readonly path: string;
    /**
     * Handle the request. Either return a response (a plain {@link IHttpResponse}, or the
     * {@link IHttpResponseBuilder} passed in as `response`), or mutate `response` and return
     * nothing.
     */
    handle(
        request: IHttpRequest,
        response: IHttpResponseBuilder
    ): Promise<IHttpResponse | IHttpResponseBuilder | void>;
}

export interface IHttpRouter {
    route(request: IHttpRequest): Promise<IHttpResponse>;
}

export const HttpRoute = new Abstraction<IHttpRoute>("HttpRoute");
export const HttpRouter = new Abstraction<IHttpRouter>("HttpRouter");

export namespace HttpRoute {
    export type Interface = IHttpRoute;
    /** The request handed to `handle()`. Shorthand for {@link IHttpRequest}. */
    export type Req = IHttpRequest;
    /** The response builder handed to `handle()`. Shorthand for {@link IHttpResponseBuilder}. */
    export type Res = IHttpResponseBuilder;
}

export namespace HttpRouter {
    export type Interface = IHttpRouter;
}

export class RouteNotFoundError extends Error {
    readonly code = "ROUTE_NOT_FOUND" as const;

    constructor(method: string, path: string) {
        super(`Route not found: ${method} ${path}`);
    }
}
