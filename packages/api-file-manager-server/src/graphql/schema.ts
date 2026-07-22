import pMap from "p-map";
import { createGraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ErrorResponse, Response } from "@webiny/handler-graphql/responses.js";
import { GetSettingsUseCase } from "@webiny/api-file-manager/features/settings/GetSettings/abstractions.js";
import { GetUploadPayloadUseCase } from "@webiny/api-file-manager/features/upload/GetUploadPayload/index.js";
import { CreateMultiPartUploadUseCase } from "@webiny/api-file-manager/features/upload/CreateMultiPartUpload/index.js";
import { CompleteMultiPartUploadUseCase } from "@webiny/api-file-manager/features/upload/CompleteMultiPartUpload/index.js";
import {
    checkPermissions,
    FileNormalizer
} from "@webiny/api-file-manager/features/upload/index.js";
import type { FileData } from "@webiny/api-file-manager/features/upload/types.js";

// Build the normalizer WITHOUT the gql context: the domain's `createFileNormalizerFromContext` reads
// `context.plugins.byType(...)` (the legacy plugins registry), which the DI-native server gql context
// does not populate — calling it throws "Cannot read properties of undefined (reading 'byType')". The
// modifier is optional; FileNormalizer still generates the id/type/key. The server has no legacy
// FileUploadModifierPlugins, so an empty (no-modifier) normalizer is the correct behaviour here.
const createNormalizer = () => new FileNormalizer();

/**
 * Upload GraphQL for the self-hosted (server) hosting type. Mirrors the SDL that `api-file-manager-s3`'s
 * `createS3GraphQLSchema` contributes (same query/mutation names + `PreSignedPostPayloadInput`), so the
 * transport-agnostic SDK (`getPresignedPostPayload` + the generic multipart-form `uploadToS3`, and the
 * multipart methods) works unchanged. The payload shape (`{ url, fields }`) is generic; only the
 * resolvers differ from S3 — they resolve the server upload use cases from the container (local disk +
 * the `/webiny-file-upload` HTTP routes) instead of constructing an S3 client.
 */
export const createServerFileManagerGraphQLSchema = () => {
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
                getPreSignedPostPayload: async (_: unknown, args: any, context: any) => {
                    const identityContext = context.container.resolve(IdentityContext);
                    try {
                        await checkPermissions(identityContext, { rwd: "w" });

                        const getSettings = context.container.resolve(GetSettingsUseCase);
                        const settingsResult = await getSettings.execute();
                        const settings = settingsResult.value;

                        const normalizer = createNormalizer();
                        const useCase = context.container.resolve(GetUploadPayloadUseCase);

                        const payload = await useCase.execute(
                            (await normalizer.normalizeFile(args.data)) as FileData,
                            settings
                        );

                        return new Response(payload);
                    } catch (e) {
                        return new ErrorResponse({
                            message: e.message,
                            code: e.code,
                            data: e.data
                        });
                    }
                },
                getPreSignedPostPayloads: async (_: unknown, args: any, context: any) => {
                    const identityContext = context.container.resolve(IdentityContext);
                    try {
                        await checkPermissions(identityContext, { rwd: "w" });

                        const getSettings = context.container.resolve(GetSettingsUseCase);
                        const settingsResult = await getSettings.execute();
                        const settings = settingsResult.value;

                        const normalizer = createNormalizer();
                        const useCase = context.container.resolve(GetUploadPayloadUseCase);

                        const files = args.data as any[];
                        const payloads = await pMap(files, async (data: any) => {
                            return useCase.execute(
                                (await normalizer.normalizeFile(data)) as FileData,
                                settings
                            );
                        });

                        return new Response(payloads);
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
                createMultiPartUpload: async (_: unknown, args: any, context: any) => {
                    const identityContext = context.container.resolve(IdentityContext);
                    try {
                        await checkPermissions(identityContext, { rwd: "w" });

                        const normalizer = createNormalizer();
                        const useCase = context.container.resolve(CreateMultiPartUploadUseCase);

                        const result = await useCase.execute({
                            file: (await normalizer.normalizeFile(args.data)) as FileData,
                            numberOfParts: args.numberOfParts
                        });

                        return new Response(result);
                    } catch (e) {
                        return new ErrorResponse({
                            message: e.message,
                            code: e.code,
                            data: e.data
                        });
                    }
                },
                completeMultiPartUpload: async (_: unknown, args: any, context: any) => {
                    const identityContext = context.container.resolve(IdentityContext);
                    try {
                        await checkPermissions(identityContext, { rwd: "w" });

                        const useCase = context.container.resolve(CompleteMultiPartUploadUseCase);
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
