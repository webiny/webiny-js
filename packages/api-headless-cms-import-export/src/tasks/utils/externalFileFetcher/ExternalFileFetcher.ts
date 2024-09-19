import type {
    IExternalFileFetcher,
    IExternalFileFetcherFetchResult,
    IExternalFileFetcherHeadResult
} from "./abstractions/ExternalFileFetcher";
import { getObjectProperties } from "@webiny/utils";
import { WebinyError } from "@webiny/error";

export interface IGetChecksumHeaderCallable {
    (headers: Headers): string | undefined | null;
}

export interface IExternalFileFetcherParams {
    fetcher: typeof fetch;
    timeout?: number;
    getChecksumHeader: IGetChecksumHeaderCallable;
}

const defaultTimeout = 5;

export class ExternalFileFetcher implements IExternalFileFetcher {
    private readonly fetcher: typeof fetch;
    private readonly timeout: number = defaultTimeout;
    private readonly _getChecksumHeader: IGetChecksumHeaderCallable;

    public constructor(params: IExternalFileFetcherParams) {
        this.fetcher = params.fetcher;
        this.timeout = params.timeout || defaultTimeout;
        this._getChecksumHeader = params.getChecksumHeader;
    }

    public async fetch(url: string): Promise<IExternalFileFetcherFetchResult> {
        try {
            const result = await this.fetcher(url, {
                method: "GET"
            });
            const contentType = result.headers.get("content-type");
            if (!contentType) {
                throw new Error(`Content type not found for URL: ${url}`);
            }
            const contentLengthString = result.headers.get("content-length");
            const contentLength = contentLengthString ? parseInt(contentLengthString) : 0;
            if (contentLength === 0) {
                throw new Error(`Content length not found for URL: ${url}`);
            }
            const checksum = this.getChecksumHeader(result.headers);
            if (!checksum) {
                throw new Error(`ETag not found for URL: ${url}`);
            }
            if (!result.body) {
                throw new Error(`Body not found for URL: ${url}`);
            }
            return {
                file: {
                    name: url.split("/").pop() as string,
                    size: contentLength,
                    url,
                    contentType,
                    body: result.body,
                    checksum
                }
            };
        } catch (ex) {
            const error = getObjectProperties<WebinyError>(ex);
            return {
                error: {
                    ...error,
                    code: error.code || "GET_FETCH_ERROR",
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
            /**
             * We will allow $timeout seconds for the HEAD request to complete.
             */
            const tId = setTimeout(() => {
                abort.abort("Timeout.");
            }, this.timeout * 1000);
            const result = await this.fetcher(url, {
                method: "HEAD",
                signal: abort.signal
            });
            /**
             * And clear timeout as soon as the request is completed.
             */
            clearTimeout(tId);
            if (result.status !== 200) {
                throw new Error(`Failed to fetch URL: ${url}. Status: ${result.status}`);
            }
            const contentType = result.headers.get("content-type");
            if (!contentType) {
                throw new Error(`Content type not found for URL: ${url}`);
            }
            const checksum = this.getChecksumHeader(result.headers);
            if (!checksum) {
                throw new Error(`ETag not found for URL: ${url}`);
            }
            const contentLength = result.headers.get("content-length");

            return {
                file: {
                    name: url.split("/").pop() as string,
                    size: parseInt(contentLength || "0"),
                    url,
                    contentType,
                    checksum
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

    private getChecksumHeader(headers: Headers): string | undefined | null {
        return this._getChecksumHeader(headers);
    }
}
