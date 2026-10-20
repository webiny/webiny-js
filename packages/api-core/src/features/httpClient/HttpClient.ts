import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { HttpClient as HttpClientAbstraction } from "./abstractions.js";
import { HttpRequestError } from "./HttpRequestError.js";
import { HttpStatusError } from "./HttpStatusError.js";

const DEFAULT_TIMEOUT_MS = 10_000;

function createRequestInit(request: HttpClientAbstraction.Request): RequestInit {
    const timeoutMs = request.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const headers = new Headers(request.headers);
    const init: RequestInit = {
        method: request.method ?? "GET",
        headers,
        signal: AbortSignal.timeout(timeoutMs)
    };

    if (request.body !== undefined) {
        if (!headers.has("content-type")) {
            headers.set("content-type", "application/json");
        }
        init.body = JSON.stringify(request.body);
    }

    return init;
}

function isTimeout(error: unknown): boolean {
    return error instanceof Error && error.name === "TimeoutError";
}

// An empty body parses to `undefined`, so a 204 is not an invalid response.
function parseJson(text: string): Result<unknown, unknown> {
    if (text === "") {
        return Result.ok(undefined);
    }
    try {
        const value: unknown = JSON.parse(text);
        return Result.ok(value);
    } catch (error) {
        return Result.fail(error);
    }
}

class HttpClientImpl implements HttpClientAbstraction.Interface {
    async requestJson(
        request: HttpClientAbstraction.Request
    ): Promise<Result<unknown, HttpClientAbstraction.Error>> {
        const { url } = request;
        const init = createRequestInit(request);

        let response: Response;
        let text: string;
        try {
            response = await fetch(url, init);
            text = await response.text();
        } catch (error) {
            const reason = isTimeout(error) ? "timeout" : "network";
            return Result.fail(new HttpRequestError({ url, reason }, error));
        }

        const body = parseJson(text);

        if (!response.ok) {
            const statusError = new HttpStatusError({
                url,
                status: response.status,
                statusText: response.statusText,
                body: body.isOk() ? body.value : undefined
            });
            return Result.fail(statusError);
        }

        if (body.isFail()) {
            return Result.fail(new HttpRequestError({ url, reason: "invalidJson" }, body.error));
        }

        return Result.ok(body.value);
    }
}

export const HttpClient = createImplementation({
    abstraction: HttpClientAbstraction,
    implementation: HttpClientImpl,
    dependencies: []
});
