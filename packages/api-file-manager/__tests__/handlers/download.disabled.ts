// TODO: temporarily disabling this test. It requires a refactor to use the graphql lambda handler.
// import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
// import { createHandler } from "@webiny/handler-aws";
// import useGqlHandler from "~tests/utils/useGqlHandler";
// import { fileAData } from "~tests/mocks/files";
// import {
//     APIGatewayEvent,
//     APIGatewayEventRequestContextWithAuthorizer
// } from "@webiny/handler-aws/types";
//
// const binaryMimeTypes: string[] = [];
// binaryMimeTypes.indexOf = () => {
//     return 1;
// };
//
// enum Files {
//     smallFile = "small-test-file-path.png",
//     largeFile = "large-test-file-path.png"
// }
//
// jest.mock("@webiny/aws-sdk/client-s3", () => {
//     return {
//         S3: class {
//             private _fileSizes = {
//                 ["small-test-file-path.png"]: 137,
//                 ["large-test-file-path.png"]: 500000001
//             };
//
//             async headObject(obj: any) {
//                 const { Key: file } = obj;
//                 return {
//                     ContentLength: this._fileSizes[file as Files]
//                 };
//             }
//
//             async getObject(obj: any) {
//                 const { Key: file } = obj;
//                 return {
//                     Body: file,
//                     ContentType: "image/png",
//                     ContentLength: this._fileSizes[file as Files] || file.length
//                 };
//             }
//         },
//
//         getSignedUrl() {
//             return "https://presigned-domain.loc/some-url?1fjdsfjdsfds";
//         },
//         GetObjectCommand: class {}
//     };
// });
//
// jest.mock("~/handlers/transform/loaders", () => {
//     return [];
// });
//
// const createFileDownloadEvent = (path: string): APIGatewayEvent => {
//     return {
//         path,
//         body: "",
//         multiValueQueryStringParameters: null,
//         httpMethod: "GET",
//         headers: {},
//         pathParameters: {
//             path: path.includes("/files/") ? path.replace("/files/", "") : path
//         },
//         queryStringParameters: null,
//         isBase64Encoded: false,
//         requestContext: {} as APIGatewayEventRequestContextWithAuthorizer<any>,
//         resource: "",
//         multiValueHeaders: {},
//         stageVariables: null
//     };
// };
//
// const createDownloadHandler = (params: Parameters<typeof createHandler>[0]) => {
//     const handler = createHandler(params);
//     return (event: APIGatewayEvent, context: any = {}) => {
//         return handler(event, context);
//     };
// };
//
// describe("download handler", () => {
//     beforeEach(() => {
//         process.env.S3_BUCKET = "some-bucket";
//         process.env.AWS_REGION = "eu-central-1";
//     });
//
//     it("should trigger s3 file download - stream", async () => {
//         const handler = createDownloadHandler({
//             plugins: [createDownloadFileByExactKeyPlugins()]
//         });
//
//         const result = await handler(createFileDownloadEvent(`/files/${Files.smallFile}`));
//
//         expect(result).toEqual({
//             body: "c21hbGwtdGVzdC1maWxlLXBhdGgucG5n",
//             isBase64Encoded: true,
//             statusCode: 200,
//             headers: {
//                 "access-control-allow-headers": "*",
//                 "access-control-allow-methods": "GET,HEAD",
//                 "access-control-allow-origin": "*",
//                 "cache-control": "public, max-age=30758400",
//                 connection: "keep-alive",
//                 "content-length": "24",
//                 "content-type": "image/png",
//                 date: expect.any(String),
//                 "x-webiny-base64-encoded": "true"
//             }
//         });
//     });
//
//     it("should trigger s3 file download - redirect", async () => {
//         const handler = createDownloadHandler({
//             plugins: [createDownloadFileByExactKeyPlugins()]
//         });
//
//         const result = await handler(createFileDownloadEvent(`/files/${Files.largeFile}`));
//
//         expect(result).toEqual({
//             body: "",
//             headers: {
//                 "access-control-allow-headers": "*",
//                 "access-control-allow-methods": "GET,HEAD",
//                 "access-control-allow-origin": "*",
//                 "cache-control": "public, max-age=900",
//                 connection: "keep-alive",
//                 "content-length": "0",
//                 "content-type": "application/json; charset=utf-8",
//                 date: expect.any(String),
//                 location: "https://presigned-domain.loc/some-url?1fjdsfjdsfds"
//             },
//             isBase64Encoded: false,
//             statusCode: 301
//         });
//     });
// });
