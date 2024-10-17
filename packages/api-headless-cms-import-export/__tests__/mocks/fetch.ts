export interface IResponse {
    toJSON?(): Promise<any>;
    toText?(): Promise<any>;
    toBlob?(): Promise<any>;
    toArrayBuffer?(): Promise<any>;
    stream: ReadableStream;
}

export interface ICreateMockFetchParams {
    (url: string): Promise<IResponse> | IResponse;
}

export const createMockFetch = (response: ICreateMockFetchParams): typeof fetch => {
    return async url => {
        if (typeof url !== "string") {
            throw new Error("Expected a string as the first argument.");
        }
        const headers = new Headers();

        const res = await response(url);
        return {
            url,
            headers,
            body: {
                getReader() {
                    return new ReadableStreamDefaultReader(res.stream);
                }
            } as ReadableStream,
            type: "default",
            redirected: false,
            status: 200,
            ok: true,
            statusText: "OK",
            json: async () => {
                if (res.toJSON) {
                    return res.toJSON();
                }
                return {};
            },
            text: async () => {
                if (res.toText) {
                    return res.toText();
                }
                return "";
            },
            bodyUsed: false,
            blob: async () => {
                if (res.toBlob) {
                    return res.toBlob();
                }
                return new Blob();
            },
            clone: () => {
                return structuredClone(this) as any;
            },
            formData: async () => {
                return new FormData();
            },
            arrayBuffer: async () => {
                if (res.toArrayBuffer) {
                    return res.toArrayBuffer();
                }
                return new ArrayBuffer(0);
            }
        };
    };
};
