import pMap from "p-map";
import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { ErrorResponse } from "@webiny/handler-graphql/responses.js";
import { Response } from "@webiny/handler-graphql/responses.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { GetSettingsUseCase } from "~/features/settings/GetSettings/abstractions.js";
import { GetUploadPayloadUseCase } from "~/features/upload/GetUploadPayload/index.js";
import { CreateMultiPartUploadUseCase } from "~/features/upload/CreateMultiPartUpload/index.js";
import { CompleteMultiPartUploadUseCase } from "~/features/upload/CompleteMultiPartUpload/index.js";
import { checkPermissions } from "~/features/upload/utils/checkPermissions.js";
import { createFileNormalizerFromContext } from "~/features/upload/utils/createFileNormalizerFromContext.js";
import type { PresignedPostPayloadData } from "~/features/upload/types.js";

class FmUploadGraphQLSchema_ implements GraphQLSchemaFactory.Interface {
    public async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        this.addTypeDefs(builder);
        this.addQueryResolvers(builder);
        this.addMutationResolvers(builder);
        return builder;
    }

    private addTypeDefs(builder: GraphQLSchemaFactory.SchemaBuilder): void {
        builder.addTypeDefs(/* GraphQL */ `
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
        `);
    }

    private addQueryResolvers(builder: GraphQLSchemaFactory.SchemaBuilder): void {
        builder.addResolver({
            path: "FmQuery.getPreSignedPostPayload",
            dependencies: [IdentityContext, GetSettingsUseCase, GetUploadPayloadUseCase],
            resolver: (
                identityContext: IdentityContext.Interface,
                getSettings: GetSettingsUseCase.Interface,
                getUploadPayload: GetUploadPayloadUseCase.Interface
            ) => {
                return async ({ args, context }: { args: any; context: any }) => {
                    try {
                        await checkPermissions(identityContext, { rwd: "w" });

                        const data = args.data as PresignedPostPayloadData;
                        const settingsResult = await getSettings.execute();
                        const settings = settingsResult.value;

                        const normalizer = createFileNormalizerFromContext(context);
                        const file = await normalizer.normalizeFile(data);

                        const result = await getUploadPayload.execute(file, settings);
                        return new Response(result);
                    } catch (e: any) {
                        return new ErrorResponse({
                            message: e.message,
                            code: e.code,
                            data: e.data
                        });
                    }
                };
            }
        });

        builder.addResolver({
            path: "FmQuery.getPreSignedPostPayloads",
            dependencies: [IdentityContext, GetSettingsUseCase, GetUploadPayloadUseCase],
            resolver: (
                identityContext: IdentityContext.Interface,
                getSettings: GetSettingsUseCase.Interface,
                getUploadPayload: GetUploadPayloadUseCase.Interface
            ) => {
                return async ({ args, context }: { args: any; context: any }) => {
                    try {
                        await checkPermissions(identityContext, { rwd: "w" });

                        const files = args.data as PresignedPostPayloadData[];
                        const settingsResult = await getSettings.execute();
                        const settings = settingsResult.value;

                        const normalizer = createFileNormalizerFromContext(context);

                        const results = await pMap(files, async data => {
                            const file = await normalizer.normalizeFile(data);
                            return getUploadPayload.execute(file, settings);
                        });

                        return new Response(results);
                    } catch (e: any) {
                        return new ErrorResponse({
                            message: e.message,
                            code: e.code,
                            data: e.data
                        });
                    }
                };
            }
        });
    }

    private addMutationResolvers(builder: GraphQLSchemaFactory.SchemaBuilder): void {
        builder.addResolver({
            path: "FmMutation.createMultiPartUpload",
            dependencies: [IdentityContext, CreateMultiPartUploadUseCase],
            resolver: (
                identityContext: IdentityContext.Interface,
                createMultiPartUpload: CreateMultiPartUploadUseCase.Interface
            ) => {
                return async ({ args, context }: { args: any; context: any }) => {
                    try {
                        await checkPermissions(identityContext, { rwd: "w" });

                        const normalizer = createFileNormalizerFromContext(context);
                        const file = await normalizer.normalizeFile(args.data);

                        const result = await createMultiPartUpload.execute({
                            file,
                            numberOfParts: args.numberOfParts
                        });

                        return new Response(result);
                    } catch (e: any) {
                        return new ErrorResponse({
                            message: e.message,
                            code: e.code,
                            data: e.data
                        });
                    }
                };
            }
        });

        builder.addResolver({
            path: "FmMutation.completeMultiPartUpload",
            dependencies: [IdentityContext, CompleteMultiPartUploadUseCase],
            resolver: (
                identityContext: IdentityContext.Interface,
                completeMultiPartUpload: CompleteMultiPartUploadUseCase.Interface
            ) => {
                return async ({ args }: { args: any }) => {
                    try {
                        await checkPermissions(identityContext, { rwd: "w" });

                        await completeMultiPartUpload.execute({
                            fileKey: args.fileKey,
                            uploadId: args.uploadId
                        });

                        return new Response(true);
                    } catch (e: any) {
                        return new ErrorResponse({
                            message: e.message,
                            code: e.code,
                            data: e.data
                        });
                    }
                };
            }
        });
    }
}

export const FmUploadGraphQLSchema = GraphQLSchemaFactory.createImplementation({
    implementation: FmUploadGraphQLSchema_,
    dependencies: []
});
