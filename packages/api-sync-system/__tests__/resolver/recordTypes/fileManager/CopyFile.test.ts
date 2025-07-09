import { CopyFile } from "~/resolver/recordTypes/fileManager/CopyFile.js";
import { createS3Client, HeadObjectCommand, S3Client } from "@webiny/aws-sdk/client-s3/index.js";
import { mockClient } from "aws-sdk-client-mock";
import {
    createMockSourceDeployment,
    createMockTargetDeployment
} from "~tests/mocks/deployments.js";
import { createLambdaClient, InvokeCommand, LambdaClient } from "@webiny/aws-sdk/client-lambda";
import { LambdaTrigger } from "~/resolver/lambda/LambdaTrigger.js";

describe("CopyFile", () => {
    it("should return null if file already exists", async () => {
        const mockedS3Client = mockClient(S3Client);

        mockedS3Client.on(HeadObjectCommand).resolves({
            ETag: "etag",
            $metadata: {
                httpStatusCode: 200
            }
        });
        const mockedLambdaClient = mockClient(LambdaClient);
        mockedLambdaClient.on(InvokeCommand).resolves({
            StatusCode: 200
        });

        const copyFile = new CopyFile({
            createS3Client: params => {
                return createS3Client(params);
            },
            getLambdaTrigger: () => {
                return new LambdaTrigger({
                    arn: "unknown",
                    createLambdaClient
                });
            }
        });

        const result = await copyFile.handle({
            source: createMockSourceDeployment(),
            target: createMockTargetDeployment(),
            key: "test-file.txt"
        });

        expect(result).toBeNull();
    });

    it("should copy file if error happens during HeadObjectCommand operation", async () => {
        const send = jest.fn();

        const mockedS3Client = mockClient(S3Client);
        mockedS3Client.on(HeadObjectCommand).callsFake(input => {
            send(input);
            throw new Error();
        });
        const mockedLambdaClient = mockClient(LambdaClient);
        mockedLambdaClient.on(InvokeCommand).resolves({
            $metadata: {
                httpStatusCode: 200
            }
        });

        const copyFile = new CopyFile({
            createS3Client: params => {
                return createS3Client(params);
            },
            getLambdaTrigger: () => {
                return new LambdaTrigger({
                    arn: "unknown",
                    createLambdaClient
                });
            }
        });

        const source = createMockSourceDeployment();
        const target = createMockTargetDeployment();
        const result = await copyFile.handle({
            source,
            target,
            key: "test-file.txt"
        });

        expect(result).toEqual({
            $metadata: {
                httpStatusCode: 200
            }
        });
        expect(send).toHaveBeenCalledTimes(1);
        expect(send).toHaveBeenCalledWith({
            Bucket: target.services.s3Id,
            Key: "test-file.txt"
        });
    });

    it("should trigger a lambda to copy file", async () => {
        const mockedS3Client = mockClient(S3Client);
        const mockedLambdaClient = mockClient(LambdaClient);

        mockedS3Client.on(HeadObjectCommand).resolves({
            ETag: "etag",
            $metadata: {
                httpStatusCode: 404
            }
        });
        mockedLambdaClient.on(InvokeCommand).resolves({
            StatusCode: 205
        });

        const copyFile = new CopyFile({
            createS3Client: params => {
                return createS3Client(params);
            },
            getLambdaTrigger: () => {
                return new LambdaTrigger({
                    arn: "unknown",
                    createLambdaClient
                });
            }
        });

        const result = await copyFile.handle({
            source: createMockSourceDeployment(),
            target: createMockTargetDeployment(),
            key: "test-file.txt"
        });

        expect(result).toEqual({
            StatusCode: 205
        });
    });
});
