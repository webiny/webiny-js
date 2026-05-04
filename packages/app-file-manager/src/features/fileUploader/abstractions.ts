import { createAbstraction } from "@webiny/feature/admin";
import type { FmFile } from "../shared/types.js";

// Data provided for each file to upload.
export interface UploadFileData {
    name: string;
    type: string;
    tags?: string[];
    location?: { folderId: string };
    [key: string]: any;
}

// Per-file upload job tracked by the FileUploader.
export interface UploadJob {
    id: string;
    fileName: string;
    status: "pending" | "uploading" | "completed" | "failed";
    progress: { sent: number; total: number; percentage: number };
    error?: string;
    result?: FmFile;
}

// Computed ViewModel exposed by the FileUploader.
export interface FileUploaderViewModel {
    jobs: UploadJob[];
    overallProgress: { sent: number; total: number; percentage: number };
    isUploading: boolean;
    completedCount: number;
    failedCount: number;
}

// Options for batch uploads.
export interface BatchUploadOptions {
    concurrency?: number;
    strategy?: "fail-fast" | "continue";
}

// FileUploader interface.
export interface IFileUploader {
    vm: FileUploaderViewModel;
    upload(file: File, data: UploadFileData): Promise<void>;
    uploadMany(
        files: Array<{ file: File; data: UploadFileData }>,
        options?: BatchUploadOptions
    ): Promise<void>;
    abort(jobId: string): void;
    clear(): void;
}

export const FileUploader = createAbstraction<IFileUploader>("FileUploader");

export namespace FileUploader {
    export type Interface = IFileUploader;
}
