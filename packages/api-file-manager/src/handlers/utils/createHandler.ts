import { HandlerEventArgs, HandlerHeaders } from "~/handlers/types";
import { Body } from "aws-sdk/clients/s3";

/**
 * We need to respond with adequate CORS headers.
 */
const baseHeaders: HandlerHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true
};
const DEFAULT_CACHE_MAX_AGE = 30758400; // 1 year

interface EventHandlerResponse {
    data: Body;
    statusCode?: number;
    headers: HandlerHeaders;
}
export interface EventHandlerCallable<T> {
    (event: T): Promise<EventHandlerResponse>;
}

export const createHandler = <T extends HandlerEventArgs>(
    eventHandler: EventHandlerCallable<T>
) => {
    return async (event: T) => {
        if (event.httpMethod === "OPTIONS") {
            return {
                body: "",
                statusCode: 204,
                headers: {
                    ...baseHeaders,
                    "Cache-Control": "public, max-age=" + DEFAULT_CACHE_MAX_AGE
                }
            };
        }

        try {
            const { data, statusCode, headers = {} } = await eventHandler(event);
            const isBuffer = Buffer.isBuffer(data);
            const body = isBuffer
                ? (data as Buffer).toString("base64")
                : JSON.stringify({
                      error: false,
                      data,
                      message: null
                  });

            return {
                isBase64Encoded: isBuffer,
                statusCode: statusCode || 200,
                headers: { ...baseHeaders, ...headers },
                body
            };
        } catch (e) {
            return {
                statusCode: 500,
                headers: baseHeaders,
                body: JSON.stringify({
                    error: true,
                    data: null,
                    message: e.message
                })
            };
        }
    };
};
