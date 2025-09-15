import { describe, expect, it, vi } from "vitest";
import { ExternalFileFetcher } from "~/tasks/utils/externalFileFetcher";
import type { GenericRecord } from "@webiny/api/types";

const createFetcherResponse = (params: Partial<Response>): Response => {
    return {
        url: "",
        body: null,
        bodyUsed: false,
        headers: new Headers(),
        type: "basic",
        ok: true,
        status: 200,
        statusText: "OK",
        clone: vi.fn(),
        redirected: false,
        arrayBuffer: vi.fn(),
        blob: vi.fn(),
        formData: vi.fn(),
        json: vi.fn(),
        text: vi.fn(),
        ...params
    } as Response;
};

describe("external file fetcher", () => {
    it("should fail to fetch a file via GET", async () => {
        expect.assertions(2);
        const results: GenericRecord = {
            url: null,
            options: null
        };
        const fetcher = new ExternalFileFetcher({
            fetcher: async (url, options) => {
                results.url = url;
                results.options = options;
                throw new Error("Fetch error!");
            },
            getChecksumHeader: () => {
                return "mocked-checksum";
            }
        });

        const url = "https://localhost/file.zip";
        try {
            const result = await fetcher.fetch(url);
            expect(result).toMatchObject({
                error: {
                    code: "GET_FETCH_ERROR",
                    data: {
                        url
                    },
                    message: "Fetch error!"
                }
            });
        } catch (ex) {
            expect(ex.message).toBe("Should not happen!");
        }
        expect(results).toEqual({
            url,
            options: {
                method: "GET"
            }
        });
    });

    it("should fail to fetch a file info via HEAD", async () => {
        expect.assertions(3);
        const results: GenericRecord = {
            url: null,
            options: null
        };
        const fetcher = new ExternalFileFetcher({
            fetcher: async (url, options) => {
                results.url = url;
                results.options = options;
                throw new Error("Fetch error!");
            },
            getChecksumHeader: () => {
                return "mocked-checksum";
            }
        });

        const url = "https://localhost/file.zip";
        try {
            const result = await fetcher.head(url);
            expect(result).toMatchObject({
                error: {
                    code: "HEAD_FETCH_ERROR",
                    data: {
                        url
                    },
                    message: "Fetch error!"
                }
            });
        } catch (ex) {
            expect(ex.message).toBe("Should not happen!");
        }
        expect(results.url).toEqual(url);
        expect(results.options.method).toEqual("HEAD");
    });

    it("should fetch a file via GET but fail due to missing headers", async () => {
        const headers = new Headers();
        const fetcher = new ExternalFileFetcher({
            fetcher: async url => {
                return createFetcherResponse({
                    url: url.toString(),
                    headers
                });
            },
            getChecksumHeader: () => {
                return headers.get("etag") || "mocked-checksum";
            }
        });

        const url = "https://localhost/file.zip";
        const missingContentTypeResult = await fetcher.fetch(url);
        expect(missingContentTypeResult).toMatchObject({
            error: {
                code: "GET_FETCH_ERROR",
                data: {
                    url
                },
                message: `Content type not found for URL: ${url}`
            }
        });

        headers.append("content-type", "application/zip");

        const missingContentLengthResult = await fetcher.fetch(url);
        expect(missingContentLengthResult).toMatchObject({
            error: {
                code: "GET_FETCH_ERROR",
                data: {
                    url
                },
                message: `Content length not found for URL: ${url}`
            }
        });
    });

    it("should fetch a file via GET but fail due to missing body", async () => {
        const headers = new Headers({
            "content-type": "application/zip",
            "content-length": "100"
        });
        const fetcher = new ExternalFileFetcher({
            fetcher: async url => {
                return createFetcherResponse({
                    url: url.toString(),
                    headers
                });
            },
            getChecksumHeader: () => {
                return headers.get("etag") || "mocked-checksum";
            }
        });
        const url = "https://localhost/file.zip";

        const result = await fetcher.fetch(url);

        expect(result).toEqual({
            error: {
                code: "GET_FETCH_ERROR",
                data: {
                    url
                },
                message: `Body not found for URL: ${url}`,
                stack: expect.any(String)
            }
        });
    });

    it("should fetch a file via GET and succeed", async () => {
        const headers = new Headers({
            "content-type": "application/zip",
            "content-length": "100"
        });
        const fetcher = new ExternalFileFetcher({
            fetcher: async url => {
                return createFetcherResponse({
                    url: url.toString(),
                    headers,
                    body: new ReadableStream()
                });
            },
            getChecksumHeader: () => {
                return headers.get("etag") || "mocked-checksum";
            }
        });
        const url = "https://localhost/file.zip";

        const result = await fetcher.fetch(url);

        expect(result).toEqual({
            file: {
                name: "file.zip",
                size: 100,
                url,
                contentType: "application/zip",
                body: expect.any(Object),
                checksum: "mocked-checksum"
            }
        });
    });

    it("should fetch a file via HEAD but fail due to missing headers and then succeed", async () => {
        const headers = new Headers();
        const fetcher = new ExternalFileFetcher({
            fetcher: async url => {
                return createFetcherResponse({
                    url: url.toString(),
                    headers
                });
            },
            getChecksumHeader: () => {
                return headers.get("etag") || "mocked-checksum";
            }
        });

        const url = "https://localhost/file.zip";
        const missingContentTypeResult = await fetcher.head(url);
        expect(missingContentTypeResult).toMatchObject({
            error: {
                code: "HEAD_FETCH_ERROR",
                data: {
                    url
                },
                message: `Content type not found for URL: ${url}`
            }
        });

        headers.append("content-type", "application/zip");

        const result = await fetcher.head(url);

        expect(result).toEqual({
            file: {
                name: "file.zip",
                size: 0,
                url,
                contentType: "application/zip",
                checksum: "mocked-checksum"
            }
        });
    });
});
