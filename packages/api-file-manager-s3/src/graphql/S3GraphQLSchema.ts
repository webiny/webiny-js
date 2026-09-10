import pMap from "p-map";
import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { GraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import { ErrorResponse, Response } from "@webiny/api-graphql/responses.js";
import { GetSettingsUseCase } from "@webiny/api-file-manager/features/settings/GetSettings/abstractions.js";
import { getPresignedPostPayload } from "~/utils/getPresignedPostPayload.js";
import { createFileNormalizerFromContext } from "~/utils/createFileNormalizerFromContext.js";
import { checkPermissions } from "./checkPermissions.js";
import type { PresignedPostPayloadData } from "~/types.js";
import { CreateMultiPartUploadUseCase } from "~/multiPartUpload/CreateMultiPartUploadUseCase.js";
import { CompleteMultiPartUploadUseCase } from "~/multiPartUpload/CompleteMultiPartUploadUseCase.js";

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

class S3GraphQLSchemaImpl implements CoreGraphQLSchemaFactory.Interface {
    public async execute(builder: GraphQLSchemaBuilder.Interface): CoreGraphQLSchemaFactory.Return {
        builder.addTypeDefs(TYPE_DEFS);

        builder.addResolver<{ data: PresignedPostPayloadData }>({
            path: "FmQuery.getPreSignedPostPayload",
            dependencies: [IdentityContext, GetSettingsUseCase, TenantContext],
            resolver(
                identityContext: IdentityContext.Interface,
                getSettings: GetSettingsUseCase.Interface,
                tenantContext: TenantContext.Interface
            ) {
                return async ({ args, context }) => {
                    try {
                        await checkPermissions(identityContext, { rwd: "w" });

                        const settingsResult = await getSettings.execute();
                        const settings = settingsResult.value;

                        const normalizer = createFileNormalizerFromContext(context);
                        const presignedPayload = await getPresignedPostPayload(
                            await normalizer.normalizeFile(args.data),
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
                };
            }
        });

        builder.addResolver<{ data: PresignedPostPayloadData[] }>({
            path: "FmQuery.getPreSignedPostPayloads",
            dependencies: [IdentityContext, GetSettingsUseCase, TenantContext],
            resolver(
                identityContext: IdentityContext.Interface,
                getSettings: GetSettingsUseCase.Interface,
                tenantContext: TenantContext.Interface
            ) {
                return async ({ args, context }) => {
                    await checkPermissions(identityContext, { rwd: "w" });

                    try {
                        const settingsResult = await getSettings.execute();
                        const settings = settingsResult.value;

                        const normalizer = createFileNormalizerFromContext(context);

                        const presignedPayloads = await pMap(args.data, async data => {
                            return getPresignedPostPayload(
                                await normalizer.normalizeFile(data),
                                settings,
                                tenantContext
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
                };
            }
        });

        builder.addResolver<{ data: any; numberOfParts: number }>({
            path: "FmMutation.createMultiPartUpload",
            dependencies: [IdentityContext],
            resolver(identityContext: IdentityContext.Interface) {
                return async ({ args, context }) => {
                    await checkPermissions(identityContext, { rwd: "w" });

                    const s3Client = new S3({ region: process.env.AWS_REGION });

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
                };
            }
        });

        builder.addResolver<{ fileKey: string; uploadId: string }>({
            path: "FmMutation.completeMultiPartUpload",
            dependencies: [IdentityContext],
            resolver(identityContext: IdentityContext.Interface) {
                return async ({ args }) => {
                    await checkPermissions(identityContext, { rwd: "w" });

                    const s3Client = new S3({ region: process.env.AWS_REGION });

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
                };
            }
        });

        return builder;
    }
}

export const S3GraphQLSchema = CoreGraphQLSchemaFactory.createImplementation({
    implementation: S3GraphQLSchemaImpl,
    dependencies: []
});
