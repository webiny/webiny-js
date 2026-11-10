import pMap from "p-map";
import { createGraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import { ErrorResponse, Response } from "@webiny/handler-graphql/responses.js";
import { getPresignedPostPayload } from "~/utils/getPresignedPostPayload.js";
import { ensureNewFileId } from "~/utils/ensureNewFileId.js";
import { checkPermissions } from "./checkPermissions.js";
import type { PresignedPostPayloadData } from "~/types.js";
import { CreateMultiPartUploadUseCase } from "~/multiPartUpload/CreateMultiPartUploadUseCase.js";
import { CompleteMultiPartUploadUseCase } from "~/multiPartUpload/CompleteMultiPartUploadUseCase.js";
import { createFileNormalizerFromContext } from "~/utils/createFileNormalizerFromContext.js";
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
                        if (settingsResult.isFail()) {
                            throw settingsResult.error;
                        }
                        const settings = settingsResult.value;

                        const normalizer = createFileNormalizerFromContext(context);
                        const tenantContext = context.container.resolve(TenantContext);
                        const file = await normalizer.normalizeFile(data);
                        await ensureNewFileId({
                            file,
                            tenantId: tenantContext.getTenant().id,
                            clientId: data.id
                        });
                        const presignedPayload = await getPresignedPostPayload(
                            file,
                            settings,
                            tenantContext
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
                        if (settingsResult.isFail()) {
                            throw settingsResult.error;
                        }
                        const settings = settingsResult.value;

                        const normalizer = createFileNormalizerFromContext(context);

                        const tenantContext = context.container.resolve(TenantContext);

                        const presignedPayloads = await pMap(files, async data => {
                            const file = await normalizer.normalizeFile(data);
                            await ensureNewFileId({
                                file,
                                tenantId: tenantContext.getTenant().id,
                                clientId: data.id
                            });
                            return getPresignedPostPayload(file, settings, tenantContext);
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

                        const tenantId = context.container.resolve(TenantContext).getTenant().id;
                        const file = await normalizer.normalizeFile(args.data);
                        await ensureNewFileId({ file, tenantId, clientId: args.data?.id });

                        const multiPartUpload = await useCase.execute({
                            file,
                            numberOfParts: args.numberOfParts,
                            tenantId
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
                            uploadId: args.uploadId,
                            tenantId: context.container.resolve(TenantContext).getTenant().id
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
