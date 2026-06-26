import type { UploadGraphQLClient } from "@webiny/app/types.js";
import type {
    CompleteUploadParams,
    CreateUploadParams,
    MultiPartUpload,
    MultiPartUploadAPI
} from "~/MultiPartUploadAPI.js";

export class MultiPartUploadGraphQLAPI implements MultiPartUploadAPI {
    private client: UploadGraphQLClient;

    constructor(client: UploadGraphQLClient) {
        this.client = client;
    }

    async createUpload(params: CreateUploadParams): Promise<MultiPartUpload> {
        const response = await this.client.execute<CreateUploadResponse>({
            query: CREATE_UPLOAD,
            variables: params
        });

        return response.fileManager.createMultiPartUpload.data;
    }

    async completeUpload(params: CompleteUploadParams): Promise<boolean> {
        const response = await this.client.execute<CompleteUploadResponse>({
            query: COMPLETE_UPLOAD,
            variables: params
        });

        return response.fileManager.completeMultiPartUpload.data;
    }
}

const CREATE_UPLOAD = /* GraphQL */ `
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

const COMPLETE_UPLOAD = /* GraphQL */ `
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
