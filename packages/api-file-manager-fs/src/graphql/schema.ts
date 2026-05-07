import { createGraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { randomUUID } from "node:crypto";

export interface CreateFsGraphQLSchemaParams {
    /**
     * Absolute or relative URL the upload form will POST to. Mirrors the
     * shape of an S3 presigned-POST payload so existing Admin UI clients
     * can issue the same upload request unchanged.
     */
    uploadUrl: string;
    /**
     * Public base URL files are served from, for the URLs returned with the
     * upload payload. The browser will GET `${baseUrl}/<key>` to render the
     * uploaded file.
     */
    baseUrl: string;
}

interface PreSignedPostPayloadInput {
    id?: string;
    name: string;
    type: string;
    size: number;
    key?: string;
    keyPrefix?: string;
}

const buildPayload = (input: PreSignedPostPayloadInput, params: CreateFsGraphQLSchemaParams) => {
    const ext = input.name.includes(".") ? input.name.slice(input.name.lastIndexOf(".")) : "";
    const key = input.key ?? `${input.keyPrefix ? `${input.keyPrefix}/` : ""}${randomUUID()}${ext}`;

    return {
        // Mirrors the S3 PresignedPost shape: `data` is the JSON the client
        // submits as the multipart form's body. The browser appends each
        // entry of `fields` to the form before the file part, so the
        // upload route can read the same `key` we promised here. Without
        // it the route would generate its own key and the file metadata
        // saved by the Admin UI (which keys off the pre-signed value)
        // would point at a non-existent path.
        data: {
            url: params.uploadUrl,
            fields: { key }
        },
        file: {
            id: input.id ?? randomUUID(),
            name: input.name,
            type: input.type,
            size: input.size,
            key
        }
    };
};

/**
 * Mirrors the S3 file-manager's `getPreSignedPostPayload` GraphQL contract
 * so Admin UI clients don't need to change to upload via the FS path. The
 * payload returned here points at the local upload route (no real signing —
 * dev-only). Multi-part upload mutations are NOT supported in the FS path.
 */
export const createFsGraphQLSchema = (params: CreateFsGraphQLSchemaParams) => {
    return createGraphQLSchemaPlugin({
        typeDefs: /* GraphQL */ `
            type FsUploadFileResponseDataFile {
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

            type FsGetPreSignedPostPayloadResponseData {
                data: JSON!
                file: FsUploadFileResponseDataFile!
            }

            type FsGetPreSignedPostPayloadResponse {
                error: FmError
                data: FsGetPreSignedPostPayloadResponseData
            }

            type FsGetPreSignedPostPayloadsResponse {
                error: FmError
                data: [FsGetPreSignedPostPayloadResponseData!]!
            }

            extend type FmQuery {
                getPreSignedPostPayload(
                    data: PreSignedPostPayloadInput!
                ): FsGetPreSignedPostPayloadResponse
                getPreSignedPostPayloads(
                    data: [PreSignedPostPayloadInput]!
                ): FsGetPreSignedPostPayloadsResponse
            }
        `,
        resolvers: {
            FmQuery: {
                getPreSignedPostPayload: async (
                    _: unknown,
                    args: { data: PreSignedPostPayloadInput }
                ) => {
                    return { data: buildPayload(args.data, params), error: null };
                },
                getPreSignedPostPayloads: async (
                    _: unknown,
                    args: { data: PreSignedPostPayloadInput[] }
                ) => {
                    return {
                        data: args.data.map(input => buildPayload(input, params)),
                        error: null
                    };
                }
            }
        }
    });
};
