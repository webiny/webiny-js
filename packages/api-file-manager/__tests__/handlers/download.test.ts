import { createHandler } from "@webiny/handler-aws/gateway";
import { createDownloadFilePlugins } from "~/handlers/download";
import { APIGatewayEvent } from "aws-lambda";

enum Files {
    smallFile = "small-test-file-path.png",
    largeFile = "large-test-file-path.png"
}

jest.mock("aws-sdk/clients/s3", () => {
    return class {
        public getObject(obj: any) {
            const { Key: file } = obj;
            const fileSizes = {
                ["small-test-file-path.png"]: 137,
                ["large-test-file-path.png"]: 50000001
            };
            return {
                promise: async () => {
                    return {
                        Body: file,
                        ContentType: "image/png",
                        ContentLength: fileSizes[file as Files]
                    };
                }
            };
        }
        public getSignedUrlPromise() {
            return "https://presigned-domain.loc/some-url?1fjdsfjdsfds";
        }
    };
});

jest.mock("~/handlers/transform/loaders", () => {
    return [];
});

const createFileDownloadEvent = (file: string): APIGatewayEvent => {
    return {
        path: `/files/${file}`,
        body: "",
        multiValueQueryStringParameters: null,
        httpMethod: "GET",
        headers: {},
        pathParameters: {
            path: file
        },
        queryStringParameters: null,
        isBase64Encoded: false,
        requestContext: {} as any,
        resource: "",
        multiValueHeaders: {},
        stageVariables: null
    };
};

describe("download handler", () => {
    it("should trigger s3 file download - stream", async () => {
        const handler = createHandler({
            plugins: [createDownloadFilePlugins()],
            lambdaOptions: {
                binaryMimeTypes: {
                    indexOf: () => {
                        return 1;
                    }
                } as unknown as string[]
            }
        });

        const result = await handler(createFileDownloadEvent(Files.smallFile), {} as any);

        expect(result).toEqual({
            body: "c21hbGwtdGVzdC1maWxlLXBhdGgucG5n",
            isBase64Encoded: true,
            statusCode: 200,
            headers: {
                "access-control-allow-headers": "*",
                "access-control-allow-methods": "GET,HEAD",
                "access-control-allow-origin": "*",
                "cache-control": "public, max-age=30758400",
                connection: "keep-alive",
                "content-length": "24",
                "content-type": "image/png",
                date: expect.any(String),
                "x-base64-encoded": "true"
            }
        });
    });

    it("should trigger s3 file download - redirect", async () => {
        const handler = createHandler({
            plugins: [createDownloadFilePlugins()]
        });

        const result = await handler(createFileDownloadEvent(Files.largeFile), {} as any);

        expect(result).toEqual({
            body: "{}",
            headers: {
                "access-control-allow-headers": "*",
                "access-control-allow-methods": "GET,HEAD",
                "access-control-allow-origin": "*",
                "cache-control": "public, max-age=900",
                connection: "keep-alive",
                "content-length": "2",
                "content-type": "application/json; charset=utf-8",
                date: expect.any(String),
                location: "https://presigned-domain.loc/some-url?1fjdsfjdsfds"
            },
            isBase64Encoded: false,
            statusCode: 301
        });
    });
});
