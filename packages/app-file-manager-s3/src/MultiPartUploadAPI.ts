import { UploadedFile } from "@webiny/app/types";

export interface CreateUploadParams {
    data: {
        size: number;
        name: string;
        type: string;
    };
    numberOfParts: number;
}

export interface CompleteUploadParams {
    fileKey: string;
    uploadId: string;
}

export interface FilePart {
    partNumber: number;
    url: string;
}

export interface MultiPartUpload {
    file: UploadedFile;
    uploadId: string;
    parts: FilePart[];
}

export interface MultiPartUploadAPI {
    createUpload(params: CreateUploadParams): Promise<MultiPartUpload>;
    completeUpload(params: CompleteUploadParams): Promise<boolean>;
}
