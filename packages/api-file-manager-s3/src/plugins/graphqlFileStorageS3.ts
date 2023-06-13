import S3 from "aws-sdk/clients/s3";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { FileManagerContext } from "@webiny/api-file-manager/types";
import { getPresignedPostPayload } from "~/utils/getPresignedPostPayload";
import WebinyError from "@webiny/error";
import { checkPermissions } from "~/plugins/checkPermissions";
import { PresignedPostPayloadData } from "~/types";
import { CreateMultiPartUploadUseCase } from "~/multiPartUpload/CreateMultiPartUploadUseCase";
import { CompleteMultiPartUploadUseCase } from "~/multiPartUpload/CompleteMultiPartUploadUseCase";

const plugin: GraphQLSchemaPlugin<FileManagerContext> = {
    type: "graphql-schema",
    name: "graphql-schema-api-file-manager-s3",
    schema: {
        typeDefs: /* GraphQL */ `
            input PreSignedPostPayloadInput {
                name: String!
                type: String!
                size: Long!
            }

            type GetPreSignedPostPayloadResponseDataFile {
                id: ID!
                name: String!
                type: String!
                size: Long!
                key: String!
            }

            type GetPreSignedPostPayloadResponseData {
                # Contains data that is necessary for initiating a file upload.
                data: JSON!
                file: UploadFileResponseDataFile!
            }

            type GetPreSignedPostPayloadResponse {
                error: FileError
                data: GetPreSignedPostPayloadResponseData
            }

            type MultiPartUploadFilePart {
                partNumber: Int!
                url: String!
            }

            type CreateMultiPartUploadResponseData {
                file: GetPreSignedPostPayloadResponseDataFile!
                uploadId: String!
                parts: [MultiPartUploadFilePart!]!
            }

            type CompleteMultiPartUploadResponse {
                data: Boolean
                error: FileError
            }

            type GetPreSignedPostPayloadsResponse {
                error: FileError
                data: [GetPreSignedPostPayloadResponseData!]!
            }

            extend type FmQuery {
                getPreSignedPostPayload(
                    data: PreSignedPostPayloadInput!
                ): GetPreSignedPostPayloadResponse
                getPreSignedPostPayloads(
                    data: [PreSignedPostPayloadInput]!
                ): GetPreSignedPostPayloadsResponse
            }

            type CreateMultiPartUploadResponse {
                data: CreateMultiPartUploadResponseData
                error: FileError
            }

            input MultiPartUploadFilePartInput {
                partNumber: Int!
                etag: String!
            }

            extend type FmMutation {
                createMultiPartUpload(
                    data: PreSignedPostPayloadInput!
                    numberOfParts: Number!
                ): CreateMultiPartUploadResponse

                completeMultiPartUpload(
                    fileKey: String!
                    uploadId: String!
                ): CompleteMultiPartUploadResponse
            }
        `,
        resolvers: {
            FmQuery: {
                getPreSignedPostPayload: async (_, args: any, context) => {
                    try {
                        await checkPermissions(context, { rwd: "w" });

                        const file = args.data as PresignedPostPayloadData;

                        const settings = await context.fileManager.getSettings();
                        if (!settings) {
                            throw new WebinyError(
                                "Missing File Manager Settings.",
                                "FILE_MANAGER_SETTINGS_ERROR",
                                { file }
                            );
                        }

                        return new Response(getPresignedPostPayload(file, settings));
                    } catch (e) {
                        return new ErrorResponse({
                            message: e.message,
                            code: e.code,
                            data: e.data
                        });
                    }
                },
                getPreSignedPostPayloads: async (_, args, context) => {
                    await checkPermissions(context, { rwd: "w" });

                    const files = args.data as PresignedPostPayloadData[];

                    try {
                        const settings = await context.fileManager.getSettings();
                        if (!settings) {
                            throw new WebinyError(
                                "Missing File Manager Settings.",
                                "FILE_MANAGER_SETTINGS_ERROR",
                                { files }
                            );
                        }

                        const presignedPayloads = files.map(file => {
                            return getPresignedPostPayload(file, settings);
                        });

                        return new Response(presignedPayloads);
                    } catch (e) {
                        return new ErrorResponse({
                            message: e.message,
                            code: e.code,
                            data: e.data
                        });
                    }
                }
            },
            FmMutation: {
                createMultiPartUpload: async (_, args, context) => {
                    await checkPermissions(context, { rwd: "w" });

                    const s3Client = new S3({
                        region: process.env.AWS_REGION,
                        signatureVersion: "v4"
                    });

                    try {
                        const useCase = new CreateMultiPartUploadUseCase(
                            String(process.env.S3_BUCKET),
                            s3Client
                        );

                        const multiPartUpload = await useCase.execute({
                            file: args.data,
                            numberOfParts: args.numberOfParts
                        });

                        return new Response(multiPartUpload);
                    } catch (e) {
                        return new ErrorResponse({
                            message: e.message,
                            code: e.code,
                            data: e.data
                        });
                    }
                },
                completeMultiPartUpload: async (_, args, context) => {
                    await checkPermissions(context, { rwd: "w" });

                    const s3Client = new S3({
                        region: process.env.AWS_REGION,
                        signatureVersion: "v4"
                    });

                    try {
                        const useCase = new CompleteMultiPartUploadUseCase(
                            String(process.env.S3_BUCKET),
                            s3Client
                        );

                        await useCase.execute({
                            fileKey: args.fileKey,
                            uploadId: args.uploadId
                        });

                        return new Response(true);
                    } catch (e) {
                        return new ErrorResponse({
                            message: e.message,
                            code: e.code,
                            data: e.data
                        });
                    }
                }
            }
        }
    }
};

export default plugin;
