import type { CookieOptions, IHttpResponse, IHttpResponseBuilder } from "./abstractions.js";
import { HttpStreamBody } from "./HttpStreamBody.js";
import type { HttpStreamSource } from "./HttpStreamBody.js";

const CONTENT_TYPE = "content-type";

const TYPE_SHORTHANDS: Record<string, string> = {
    json: "application/json",
    text: "text/plain; charset=utf-8",
    html: "text/html; charset=utf-8",
    xml: "application/xml",
    bin: "application/octet-stream"
};

/**
 * Serialize a single `Set-Cookie` value. Kept dependency-free (no `cookie` package) — the attribute
 * set below is everything the framework needs.
 */
export function serializeCookie(name: string, value: string, options: CookieOptions = {}): string {
    const parts = [`${name}=${encodeURIComponent(value)}`];

    if (options.maxAge !== undefined) {
        parts.push(`Max-Age=${Math.floor(options.maxAge)}`);
    }
    if (options.domain) {
        parts.push(`Domain=${options.domain}`);
    }
    // Default to "/" so a cookie set on e.g. POST /graphql isn't scoped to that one path.
    parts.push(`Path=${options.path ?? "/"}`);
    if (options.expires) {
        parts.push(`Expires=${options.expires.toUTCString()}`);
    }
    if (options.httpOnly) {
        parts.push("HttpOnly");
    }
    if (options.secure) {
        parts.push("Secure");
    }
    if (options.partitioned) {
        parts.push("Partitioned");
    }
    if (options.sameSite) {
        const sameSite = options.sameSite;
        parts.push(`SameSite=${sameSite.charAt(0).toUpperCase()}${sameSite.slice(1)}`);
    }

    return parts.join("; ");
}

export class HttpResponseBuilder implements IHttpResponseBuilder {
    private statusCodeValue = 200;
    private headerValues: Record<string, string> = {};
    private cookieValues: string[] = [];
    private bodyValue: any;
    private modified = false;

    status(statusCode: number): this {
        this.statusCodeValue = statusCode;
        this.modified = true;
        return this;
    }

    header(name: string, value: string): this {
        this.headerValues[name.toLowerCase()] = value;
        this.modified = true;
        return this;
    }

    setHeaders(headers: Record<string, string>): this {
        for (const [name, value] of Object.entries(headers)) {
            this.header(name, value);
        }
        return this;
    }

    getHeader(name: string): string | undefined {
        return this.headerValues[name.toLowerCase()];
    }

    removeHeader(name: string): this {
        delete this.headerValues[name.toLowerCase()];
        this.modified = true;
        return this;
    }

    type(contentType: string): this {
        return this.header(CONTENT_TYPE, TYPE_SHORTHANDS[contentType] ?? contentType);
    }

    cookie(name: string, value: string, options?: CookieOptions): this {
        this.cookieValues.push(serializeCookie(name, value, options));
        this.modified = true;
        return this;
    }

    clearCookie(name: string, options?: Omit<CookieOptions, "expires" | "maxAge">): this {
        return this.cookie(name, "", {
            ...options,
            expires: new Date(0),
            maxAge: 0
        });
    }

    json(body?: any): this {
        if (this.getHeader(CONTENT_TYPE) === undefined) {
            this.type("json");
        }
        // Serialize here rather than leaving an object for the transport, so the body a route
        // produces is the exact bytes that go out regardless of transport.
        this.bodyValue = body === undefined ? undefined : JSON.stringify(body);
        this.modified = true;
        return this;
    }

    send(body?: any): this {
        if (body === undefined || body === null) {
            return this.end(body);
        }
        if (typeof body === "string") {
            if (this.getHeader(CONTENT_TYPE) === undefined) {
                this.type("html");
            }
            return this.end(body);
        }
        if (Buffer.isBuffer(body) || body instanceof Uint8Array) {
            if (this.getHeader(CONTENT_TYPE) === undefined) {
                this.type("bin");
            }
            return this.end(body);
        }
        return this.json(body);
    }

    text(body: string): this {
        return this.type("text").end(body);
    }

    html(body: string): this {
        return this.type("html").end(body);
    }

    redirect(url: string, statusCode = 302): this {
        return this.status(statusCode).header("location", url).end();
    }

    end(body?: any): this {
        this.bodyValue = body;
        this.modified = true;
        return this;
    }

    sse(source: HttpStreamSource): this {
        // `no-transform` and `x-accel-buffering: no` are the two that silently matter: without them a
        // proxy compresses or buffers the body and the response stops being incremental while still
        // looking correct. See the interface docs.
        return this.setHeaders({
            "content-type": "text/event-stream",
            "cache-control": "no-cache, no-transform",
            connection: "keep-alive",
            "x-accel-buffering": "no"
        }).end(new HttpStreamBody(source));
    }

    /**
     * Whether anything was set on this builder. The router uses it to decide if builder state needs
     * merging into a plain IHttpResponse a route returned instead.
     */
    isModified(): boolean {
        return this.modified;
    }

    toResponse(): IHttpResponse {
        const response: IHttpResponse = { statusCode: this.statusCodeValue };
        if (Object.keys(this.headerValues).length > 0) {
            response.headers = { ...this.headerValues };
        }
        if (this.cookieValues.length > 0) {
            response.cookies = [...this.cookieValues];
        }
        if (this.bodyValue !== undefined) {
            response.body = this.bodyValue;
        }
        return response;
    }
}

export function createHttpResponseBuilder(): HttpResponseBuilder {
    return new HttpResponseBuilder();
}
