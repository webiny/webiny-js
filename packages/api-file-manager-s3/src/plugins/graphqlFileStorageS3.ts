import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import checkBasePermissions from "@webiny/api-file-manager/plugins/crud/utils/checkBasePermissions";
import { FileManagerContext } from "@webiny/api-file-manager/types";
import getPresignedPostPayload from "../utils/getPresignedPostPayload";
import WebinyError from "@webiny/error";

const BATCH_UPLOAD_MAX_FILES = 20;

const plugin: GraphQLSchemaPlugin<FileManagerContext> = {
    type: "graphql-schema",
    name: "graphql-schema-api-file-manager-s3",
    schema: {
        typeDefs: /* GraphQL */ `
            input PreSignedPostPayloadInput {
                name: String!
                type: String!
                size: Int!
            }

            type GetPreSignedPostPayloadResponseDataFile {
                id: ID!
                name: String!
                type: String!
                size: Int!
                key: String!
            }

            type GetPreSignedPostPayloadResponseData {
                # Contains data that is necessary for initiating a file upload.
                data: JSON
                file: UploadFileResponseDataFile
            }

            type GetPreSignedPostPayloadResponse {
                error: FileError
                data: GetPreSignedPostPayloadResponseData
            }

            type GetPreSignedPostPayloadsResponse {
                error: FileError
                data: [GetPreSignedPostPayloadResponseData]!
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
                        await checkBasePermissions(context, { rwd: "w" });

                        const { data } = args;
                        const settings = await context.fileManager.settings.getSettings();
                        if (!settings) {
                            throw new WebinyError(
                                "Missing File Manager Settings.",
                                "FILE_MANAGER_SETTINGS_ERROR",
                                {
                                    file: data
                                }
                            );
                        }
                        const response = await getPresignedPostPayload(data, settings);

                        return new Response(response);
                    } catch (e) {
                        return new ErrorResponse({
                            message: e.message,
                            code: e.code,
                            data: e.data
                        });
                    }
                },
                getPreSignedPostPayloads: async (_, args: any, context) => {
                    await checkBasePermissions(context, { rwd: "w" });

                    const { data: files } = args;
                    if (!Array.isArray(files)) {
                        return new ErrorResponse({
                            code: "UPLOAD_FILES_NON_ARRAY",
                            message: `"data" argument must be an array.`
                        });
                    }

                    if (files.length === 0) {
                        return new ErrorResponse({
                            code: "UPLOAD_FILES_MIN_FILES",
                            message: `"data" argument must contain at least one file.`
                        });
                    }

                    if (files.length > BATCH_UPLOAD_MAX_FILES) {
                        return new ErrorResponse({
                            code: "UPLOAD_FILES_MAX_FILES",
                            message: `"data" argument must not contain more than ${BATCH_UPLOAD_MAX_FILES} files.`
                        });
                    }

                    try {
                        const settings = await context.fileManager.settings.getSettings();
                        if (!settings) {
                            throw new WebinyError(
                                "Missing File Manager Settings.",
                                "FILE_MANAGER_SETTINGS_ERROR",
                                {
                                    files
                                }
                            );
                        }

                        const promises = [];
                        for (const item of files) {
                            promises.push(getPresignedPostPayload(item, settings));
                        }

                        return new Response(await Promise.all(promises));
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
