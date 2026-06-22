export interface PresignedPostPayloadData {
    name: string;
    type: string;
    size: number;
    id?: string;
    key?: string;
    keyPrefix?: string;
}

export interface FileData {
    id: string;
    key: string;
    name: string;
    size: number;
    type: string;
}

export interface UploadPayloadResponse {
    data: Record<string, unknown>;
    file: FileData;
}

export interface MultiPartUploadFilePart {
    partNumber: number;
    url: string;
}

export interface CreateMultiPartUploadResult {
    file: FileData;
    uploadId: string;
    parts: MultiPartUploadFilePart[];
}
