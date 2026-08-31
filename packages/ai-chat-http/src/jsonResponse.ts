import type { IHttpResponse } from "@webiny/event-handler-core";

/** A buffered JSON response. Both chat routes answer their error cases this way. */
export const jsonResponse = (statusCode: number, body: unknown): IHttpResponse => {
    return {
        statusCode,
        headers: { "content-type": "application/json" },
        body
    };
};
