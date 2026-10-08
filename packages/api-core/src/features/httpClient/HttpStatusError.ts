import { BaseError } from "@webiny/feature/api";

export interface HttpStatusErrorData {
    url: string;
    status: number;
    statusText: string;
    body: unknown; // the parsed JSON body, or `undefined` when there was none
}

/** The server answered with a non-2xx status. */
export class HttpStatusError extends BaseError<HttpStatusErrorData> {
    override readonly code = "HttpClient/Status" as const;

    constructor(data: HttpStatusErrorData) {
        super({
            message: `Request to "${data.url}" failed with status ${data.status}.`,
            data
        });
    }
}
