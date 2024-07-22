import {
    IExternalFileFetcher,
    IExternalFileFetcherFetchResult,
    IExternalFileFetcherHeadResult
} from "./abstractions/ExternalFileFetcher";
import { getObjectProperties } from "@webiny/utils";
import { WebinyError } from "@webiny/error";
import { GenericRecord } from "@webiny/api/types";

export interface IExternalFileFetcherParams {
    fetch: typeof fetch;
}

export class ExternalFileFetcher implements IExternalFileFetcher {
    private readonly fetchMethod: typeof fetch;

    public constructor(params: IExternalFileFetcherParams) {
        this.fetchMethod = params.fetch;
    }

    public async fetch(url: string): Promise<IExternalFileFetcherFetchResult> {
        try {
            const result = await this.fetchMethod(url, {
                method: "GET"
            });
            const contentType = result.headers.get("content-type");
            if (!contentType) {
                throw new Error(`Content type not found for URL: ${url}`);
            }
            const contentLength = result.headers.get("content-length");
            if (!result.body) {
                throw new Error(`Body not found for URL: ${url}`);
            }
            return {
                file: {
                    name: url.split("/").pop() as string,
                    size: parseInt(contentLength || "0"),
                    url,
                    contentType,
                    body: result.body
                }
            };
        } catch (ex) {
            const error = getObjectProperties<WebinyError>(ex);
            return {
                error: {
                    ...error,
                    code: error.code || "HEAD_FETCH_ERROR",
                    data: {
                        ...error.data,
                        url
                    }
                }
            };
        }
    }

    public async head(url: string): Promise<IExternalFileFetcherHeadResult> {
        const abort = new AbortController();
        try {
            const t = setTimeout(() => {
                abort.abort("Timeout.");
            }, 5000);
            const result = await this.fetchMethod(url, {
                method: "HEAD",
                signal: abort.signal
            });
            const headers: GenericRecord = {};
            for (const [key, value] of result.headers.entries()) {
                headers[key] = value;
            }
            console.log("headers", headers);
            clearTimeout(t);
            const contentType = result.headers.get("content-type");
            if (!contentType) {
                throw new Error(`Content type not found for URL: ${url}`);
            }
            const contentLength = result.headers.get("content-length");
            return {
                file: {
                    name: url.split("/").pop() as string,
                    size: parseInt(contentLength || "0"),
                    url,
                    contentType
                }
            };
        } catch (ex) {
            const error = getObjectProperties<WebinyError>(ex);
            console.error(error);
            return {
                error: {
                    ...error,
                    code: error.code || "HEAD_FETCH_ERROR",
                    data: {
                        ...error.data,
                        url
                    }
                }
            };
        }
    }
}
