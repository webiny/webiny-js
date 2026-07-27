import pMap from "p-map";
import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { GraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ErrorResponse, Response } from "@webiny/api-graphql/responses.js";
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

const TYPE_DEFS = /* GraphQL */ `
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
        getPreSignedPostPayload(data: PreSignedPostPayloadInput!): GetPreSignedPostPayloadResponse
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
`;

/**
 * Upload GraphQL for the self-hosted (server) hosting type. Mirrors the SDL that `api-file-manager-s3`'s
 * `S3GraphQLSchema` contributes (same query/mutation names + `PreSignedPostPayloadInput`), so the
 * transport-agnostic SDK works unchanged. Only the resolvers differ from S3 — they resolve the server
 * upload use cases (local disk + the `/webiny-file-upload` HTTP routes) instead of an S3 client.
 */
class ServerGraphQLSchemaImpl implements CoreGraphQLSchemaFactory.Interface {
    public async execute(builder: GraphQLSchemaBuilder.Interface): CoreGraphQLSchemaFactory.Return {
        builder.addTypeDefs(TYPE_DEFS);

        builder.addResolver<{ data: any }>({
            path: "FmQuery.getPreSignedPostPayload",
            dependencies: [IdentityContext, GetSettingsUseCase, GetUploadPayloadUseCase],
            resolver(
                identityContext: IdentityContext.Interface,
                getSettings: GetSettingsUseCase.Interface,
                getUploadPayload: GetUploadPayloadUseCase.Interface
            ) {
                return async ({ args }) => {
                    try {
                        await checkPermissions(identityContext, { rwd: "w" });

                        const settingsResult = await getSettings.execute();
                        const settings = settingsResult.value;

                        const normalizer = createNormalizer();
                        const payload = await getUploadPayload.execute(
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
                };
            }
        });

        builder.addResolver<{ data: any[] }>({
            path: "FmQuery.getPreSignedPostPayloads",
            dependencies: [IdentityContext, GetSettingsUseCase, GetUploadPayloadUseCase],
            resolver(
                identityContext: IdentityContext.Interface,
                getSettings: GetSettingsUseCase.Interface,
                getUploadPayload: GetUploadPayloadUseCase.Interface
            ) {
                return async ({ args }) => {
                    try {
                        await checkPermissions(identityContext, { rwd: "w" });

                        const settingsResult = await getSettings.execute();
                        const settings = settingsResult.value;

                        const normalizer = createNormalizer();
                        const payloads = await pMap(args.data, async (data: any) => {
                            return getUploadPayload.execute(
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
                };
            }
        });

        builder.addResolver<{ data: any; numberOfParts: number }>({
            path: "FmMutation.createMultiPartUpload",
            dependencies: [IdentityContext, CreateMultiPartUploadUseCase],
            resolver(
                identityContext: IdentityContext.Interface,
                createMultiPartUpload: CreateMultiPartUploadUseCase.Interface
            ) {
                return async ({ args }) => {
                    try {
                        await checkPermissions(identityContext, { rwd: "w" });

                        const normalizer = createNormalizer();
                        const result = await createMultiPartUpload.execute({
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
                };
            }
        });

        builder.addResolver<{ fileKey: string; uploadId: string }>({
            path: "FmMutation.completeMultiPartUpload",
            dependencies: [IdentityContext, CompleteMultiPartUploadUseCase],
            resolver(
                identityContext: IdentityContext.Interface,
                completeMultiPartUpload: CompleteMultiPartUploadUseCase.Interface
            ) {
                return async ({ args }) => {
                    try {
                        await checkPermissions(identityContext, { rwd: "w" });

                        await completeMultiPartUpload.execute({
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
                };
            }
        });

        return builder;
    }
}

export const ServerGraphQLSchema = CoreGraphQLSchemaFactory.createImplementation({
    implementation: ServerGraphQLSchemaImpl,
    dependencies: []
});
