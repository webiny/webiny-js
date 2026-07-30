import { createImplementation } from "@webiny/di";
import { ApiStreamClient, ApiStreamRequestError } from "./abstractions.js";
import { EnvConfig } from "~/features/envConfig/index.js";

function toFetchHeaders(headers: ApiStreamClient.Headers = {}): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
        if (value !== undefined) {
            result[key] = String(value);
        }
    }
    return result;
}

function joinUrl(base: string, path: string): string {
    return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

class ApiStreamClientImpl implements ApiStreamClient.Interface {
    private readonly apiUrl: string;

    constructor(envConfig: EnvConfig.Interface) {
        // The API root, not `graphqlApiUrl` — streaming routes live beside /graphql, not under it.
        this.apiUrl = envConfig.get("apiUrl");
    }

    async execute(params: ApiStreamClient.Request): Promise<Response> {
        const method = params.method ?? "POST";
        const hasBody = params.body !== undefined && method !== "GET";

        let response: Response;
        try {
            response = await fetch(joinUrl(this.apiUrl, params.path), {
                method,
                headers: {
                    accept: "text/event-stream",
                    ...(hasBody ? { "content-type": "application/json" } : {}),
                    ...toFetchHeaders(params.headers)
                },
                body: hasBody ? JSON.stringify(params.body) : undefined,
                signal: params.signal
            });
        } catch (err) {
            // Preserve an abort: it isn't a network failure and callers need to tell them apart.
            if (err instanceof DOMException && err.name === "AbortError") {
                throw err;
            }
            throw new Error(`Network error: ${(err as Error).message}`);
        }

        if (!response.ok) {
            throw await this.toError(response);
        }

        if (!response.body) {
            throw new ApiStreamRequestError(
                "The response carried no readable body.",
                response.status
            );
        }

        return response;
    }

    /**
     * Streaming routes answer with a normal JSON error for anything they detect BEFORE opening the
     * stream (unknown file, no permission, bad input), which is why those arrive here as a non-2xx
     * rather than as an in-stream event.
     */
    private async toError(response: Response): Promise<ApiStreamRequestError> {
        let message = `Request failed with status ${response.status}.`;
        let code: string | undefined;

        try {
            const json = await response.json();
            if (json?.message) {
                message = json.message;
            }
            if (json?.code) {
                code = json.code;
            }
        } catch {
            // Non-JSON error body — keep the status-based message.
        }

        return new ApiStreamRequestError(message, response.status, code);
    }
}

export const FetchApiStreamClient = createImplementation({
    abstraction: ApiStreamClient,
    implementation: ApiStreamClientImpl,
    dependencies: [EnvConfig]
});
