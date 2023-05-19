import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { FileManagerContext } from "@webiny/api-file-manager/types";
import { getPresignedPostPayload } from "~/utils/getPresignedPostPayload";
import WebinyError from "@webiny/error";
import { checkPermission } from "~/plugins/checkPermission";
import { PresignedPostPayloadData } from "~/types";

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
        `,
        resolvers: {
            FmQuery: {
                getPreSignedPostPayload: async (_, args: any, context) => {
                    try {
                        await checkPermission(context, { rwd: "w" });

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
                    await checkPermission(context, { rwd: "w" });

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
            }
        }
    }
};

export default plugin;
