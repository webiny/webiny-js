import * as http from "http";

type ExtraHeaders = {
    "content-type"?: string | undefined;
    "x-webiny-version"?: http.OutgoingHttpHeader | undefined;
};

type AllHeaders = http.OutgoingHttpHeaders & ExtraHeaders;

export type StandardHeaderValue = http.OutgoingHttpHeader | boolean | undefined;

// Extract known standard headers, and remove all non-string keys.
export type StandardHeaders = {
    [K in keyof AllHeaders as string extends K
        ? never
        : number extends K
        ? never
        : K]: http.OutgoingHttpHeaders[K];
} & {
    [name: string]: StandardHeaderValue;
};

function isFunction<T>(setter: unknown): setter is (value: T) => T {
    return typeof setter === "function";
}

type Setter<T> = ((value: T) => T) | T;

export class ResponseHeaders {
    private readonly headers = new Map<keyof StandardHeaders, StandardHeaderValue>();

    private constructor(initialHeaders?: StandardHeaders) {
        if (initialHeaders) {
            (Object.keys(initialHeaders) as Array<keyof StandardHeaders>).forEach(key => {
                this.headers.set(key, initialHeaders[key]);
            });
        }
    }

    set<T extends keyof StandardHeaders>(header: T, setter: Setter<StandardHeaders[T]>) {
        if (isFunction<StandardHeaders[T]>(setter)) {
            const previousValue = this.headers.get(header) as StandardHeaders[T];
            const newValue = setter(previousValue);
            this.headers.set(header, newValue);
            return this;
        }

        this.headers.set(header, setter);

        return this;
    }

    merge(headers: ResponseHeaders) {
        return ResponseHeaders.create({ ...this.getHeaders(), ...headers.getHeaders() });
    }

    getHeaders() {
        return Object.fromEntries(this.headers);
    }

    static create(initialHeaders?: StandardHeaders) {
        return new ResponseHeaders(initialHeaders);
    }
}
