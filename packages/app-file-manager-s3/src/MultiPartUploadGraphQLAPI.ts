import { UploadOptions } from "@webiny/app/types";
import gql from "graphql-tag";
import {
    CompleteUploadParams,
    CreateUploadParams,
    MultiPartUpload,
    MultiPartUploadAPI
} from "~/MultiPartUploadAPI";

export class MultiPartUploadGraphQLAPI implements MultiPartUploadAPI {
    private client: UploadOptions["apolloClient"];

    constructor(client: UploadOptions["apolloClient"]) {
        this.client = client;
    }

    async createUpload(params: CreateUploadParams): Promise<MultiPartUpload> {
        const { data, errors } = await this.client.mutate<CreateUploadResponse>({
            mutation: CREATE_UPLOAD,
            variables: params
        });

        if (!data) {
            console.error(errors);
            throw new Error(`Failed to initialize a multi-part file upload!`);
        }

        return data.fileManager.createMultiPartUpload.data;
    }

    async completeUpload(params: CompleteUploadParams): Promise<boolean> {
        const { data, errors } = await this.client.mutate<CompleteUploadResponse>({
            mutation: COMPLETE_UPLOAD,
            variables: params
        });

        if (!data) {
            console.error(errors);
            throw new Error(`Failed to complete a multi-part file upload!`);
        }

        return data.fileManager.completeMultiPartUpload.data;
    }
}

const CREATE_UPLOAD = gql`
    mutation CreateMultiPartUpload($data: PreSignedPostPayloadInput!, $numberOfParts: Number!) {
        fileManager {
            createMultiPartUpload(data: $data, numberOfParts: $numberOfParts) {
                data {
                    file {
                        id
                        key
                        name
                        size
                        type
                    }
                    uploadId
                    parts {
                        partNumber
                        url
                    }
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

interface CreateUploadResponse {
    fileManager: {
        createMultiPartUpload: {
            data: MultiPartUpload;
            error: {
                code: string;
                message: string;
                data: Record<string, any>;
            };
        };
    };
}

const COMPLETE_UPLOAD = gql`
    mutation CompleteMultiPartUpload($fileKey: String!, $uploadId: String!) {
        fileManager {
            completeMultiPartUpload(fileKey: $fileKey, uploadId: $uploadId) {
                data
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

interface CompleteUploadResponse {
    fileManager: {
        completeMultiPartUpload: {
            data: boolean;
            error: {
                code: string;
                message: string;
                data: Record<string, any>;
            };
        };
    };
}
