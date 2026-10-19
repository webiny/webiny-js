import { BaseError } from "@webiny/feature/api";

export interface HttpRequestErrorData {
    url: string;
    reason: "network" | "timeout" | "invalidJson";
}

/** The request didn't produce a usable response: it failed, timed out, or the body wasn't JSON. */
export class HttpRequestError extends BaseError<HttpRequestErrorData> {
    override readonly code = "HttpClient/Request" as const;

    constructor(data: HttpRequestErrorData, cause: unknown) {
        super({
            message: `Request to "${data.url}" failed (${data.reason}).`,
            data
        });
        this.cause = cause;
    }
}
