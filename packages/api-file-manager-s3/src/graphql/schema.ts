import pMap from "p-map";
import { createGraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import { ErrorResponse, Response } from "@webiny/handler-graphql/responses.js";
import { getPresignedPostPayload } from "~/utils/getPresignedPostPayload.js";
import { checkPermissions } from "@webiny/api-file-manager/features/upload/index.js";
import { createFileNormalizerFromContext } from "@webiny/api-file-manager/features/upload/index.js";
import type { PresignedPostPayloadData } from "@webiny/api-file-manager/features/upload/index.js";
import { CreateMultiPartUploadUseCase } from "~/multiPartUpload/CreateMultiPartUploadUseCase.js";
import { CompleteMultiPartUploadUseCase } from "~/multiPartUpload/CompleteMultiPartUploadUseCase.js";
import { GetSettingsUseCase } from "@webiny/api-file-manager/features/settings/GetSettings/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";

export const createS3GraphQLSchema = () => {
    return createGraphQLSchemaPlugin({
        typeDefs: /* GraphQL */ `
            type UploadFileResponseDataFile {
                id: ID!
                name: String!
                type: String!
                size: Long!
                key: String!
            }

            input PreSignedPostPayloadInput {
                id: ID
                name: String!
                type: String!
                size: Long!
                key: String
                keyPrefix: String
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
                error: FmError
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
                error: FmError
            }

            type GetPreSignedPostPayloadsResponse {
                error: FmError
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
                error: FmError
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
                    const identityContext = context.container.resolve(IdentityContext);
                    const getSettings = context.container.resolve(GetSettingsUseCase);

                    try {
                        await checkPermissions(identityContext, { rwd: "w" });

                        const data = args.data as PresignedPostPayloadData;

                        const settingsResult = await getSettings.execute();
                        const settings = settingsResult.value;

                        const normalizer = createFileNormalizerFromContext(context);
                        const presignedPayload = await getPresignedPostPayload(
                            await normalizer.normalizeFile(data),
                            settings,
                            context.container.resolve(TenantContext)
                        );

                        return new Response(presignedPayload);
                    } catch (e) {
                        return new ErrorResponse({
                            message: e.message,
                            code: e.code,
                            data: e.data
                        });
                    }
                },
                getPreSignedPostPayloads: async (_, args, context) => {
                    const identityContext = context.container.resolve(IdentityContext);
                    const getSettings = context.container.resolve(GetSettingsUseCase);
                    await checkPermissions(identityContext, { rwd: "w" });

                    const files = args.data as PresignedPostPayloadData[];

                    try {
                        const settingsResult = await getSettings.execute();
                        const settings = settingsResult.value;

                        const normalizer = createFileNormalizerFromContext(context);

                        const presignedPayloads = await pMap(files, async data => {
                            return getPresignedPostPayload(
                                await normalizer.normalizeFile(data),
                                settings,
                                context.container.resolve(TenantContext)
                            );
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
                    const identityContext = context.container.resolve(IdentityContext);
                    await checkPermissions(identityContext, { rwd: "w" });

                    const s3Client = new S3({
                        region: process.env.AWS_REGION
                    });

                    try {
                        const useCase = new CreateMultiPartUploadUseCase(
                            String(process.env.S3_BUCKET),
                            s3Client
                        );

                        const normalizer = createFileNormalizerFromContext(context);

                        const multiPartUpload = await useCase.execute({
                            file: await normalizer.normalizeFile(args.data),
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
                    const identityContext = context.container.resolve(IdentityContext);
                    await checkPermissions(identityContext, { rwd: "w" });

                    const s3Client = new S3({
                        region: process.env.AWS_REGION
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
    });
};
