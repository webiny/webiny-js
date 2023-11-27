import { UploadedFile, UploadOptions } from "@webiny/app/types";
import { FileUploadStrategy } from "~/index";
import { MultiPartUploader } from "~/MultiPartUploader";
import { MultiPartUploadGraphQLAPI } from "~/MultiPartUploadGraphQLAPI";

export class MultiPartUploadStrategy implements FileUploadStrategy {
    async upload(file: File, options: UploadOptions): Promise<UploadedFile> {
        const api = new MultiPartUploadGraphQLAPI(options.apolloClient);

        const uploader = new MultiPartUploader(api, {
            chunkSize: this.detectChunkSize(),
            parallelUploads: this.detectParallelChunks()
        });

        if (options.onProgress) {
            uploader.onProgress(options.onProgress);
        }
        return uploader.uploadFile(file);
    }

    private detectChunkSize(): number {
        const envSize = parseInt(process.env.WEBINY_FILE_UPLOAD_CHUNK_SIZE || "0");

        // For dev purposes, we take this global var into consideration.
        if (process.env.NODE_ENV === "development") {
            // @ts-expect-error
            const windowSize = window["fmUploadChunkSize"];
            if (windowSize) {
                return windowSize;
            }
        }

        // As a last resort, we check the baked in value, or fall back to 50MB chunk size.
        return envSize || 50;
    }

    private detectParallelChunks(): number {
        const envChunks = parseInt(process.env.WEBINY_FILE_UPLOAD_PARALLEL_CHUNKS || "0");

        // For dev purposes, we take this global var into consideration.
        if (process.env.NODE_ENV === "development") {
            // @ts-expect-error
            const windowChunks = window["fmUploadParallelChunks"];
            if (windowChunks) {
                return windowChunks;
            }
        }

        // As a last resort, we check the baked in value, or fall back to 5 parallel chunks.
        return envChunks || 5;
    }
}
