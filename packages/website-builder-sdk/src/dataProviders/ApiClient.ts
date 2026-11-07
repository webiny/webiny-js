import { resolveHeaders, type HeadersConfig } from "@webiny/sdk";

interface QueryParams {
    query: string;
    variables: Record<string, any>;
}

export interface ApiClientConfig {
    apiHost: string;
    apiKey: string;
    apiTenant: string;
    /** Extra headers sent with every request; a function is called before each request. */
    headers?: HeadersConfig;
    preview?: boolean;
}

type WithPath<T> = T & {
    path?: string;
    next?: Record<string, any>;
};

// Set by the client itself: configured extra headers can't replace them.
const PROTECTED_HEADERS = ["x-tenant", "authorization"];

function headerEntries(headers: HeadersInit | undefined): [string, string][] {
    if (!headers) {
        return [];
    }
    if (headers instanceof Headers) {
        return Array.from(headers.entries());
    }
    return Array.isArray(headers) ? (headers as [string, string][]) : Object.entries(headers);
}

/**
 * The headers of several sources, a later one's value replacing an earlier one's whatever the case of the
 * name (header names are case-insensitive; `fetch` would otherwise send both values, joined).
 */
function mergeHeaders(...sources: Array<HeadersInit | undefined>): Record<string, string> {
    const merged = new Map<string, [string, string]>();
    for (const source of sources) {
        for (const [name, value] of headerEntries(source)) {
            merged.set(name.toLowerCase(), [name, value]);
        }
    }
    return Object.fromEntries(merged.values());
}

export class ApiClient {
    private readonly config: ApiClientConfig;

    constructor(config: ApiClientConfig) {
        this.config = config;
    }

    async fetch({ headers, path, ...params }: WithPath<RequestInit>): Promise<any> {
        return fetch(`${this.config.apiHost}${path}`, {
            method: "GET",
            headers: mergeHeaders(
                { "Content-Type": "application/json" },
                // Under the tenant and the API key: extra headers can't replace either.
                headerEntries(await resolveHeaders(this.config.headers)).filter(
                    ([name]) => !PROTECTED_HEADERS.includes(name.toLowerCase())
                ),
                {
                    "X-Tenant": this.config.apiTenant,
                    Authorization: "Bearer " + this.config.apiKey
                },
                headers
            ),
            ...params
        }).then(res => res.json());
    }

    async query({ query, variables }: QueryParams, options?: { noStore?: boolean }) {
        // Runtime reads (e.g. the experiment kill-switch) must bypass the cache so they take
        // effect immediately; everything else caches and revalidates on an interval.
        const fetchOptions: Pick<WithPath<RequestInit>, "cache" | "next"> = options?.noStore
            ? { cache: "no-store" }
            : { next: { revalidate: this.config.preview ? 0 : 60 } };

        const request: WithPath<RequestInit> = {
            ...fetchOptions,
            path: "/graphql",
            method: "POST",
            body: JSON.stringify({
                query,
                variables
            })
        };

        const json = await this.fetch(request);

        if (json.message) {
            throw new Error(json.message);
        }

        if (json.errors) {
            console.error(json.errors);
            throw new Error("Failed to fetch API");
        }

        return json.data;
    }
}
