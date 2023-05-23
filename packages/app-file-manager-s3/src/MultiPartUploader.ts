import pRetry from "p-retry";
import { MultiPartUpload, MultiPartUploadAPI, FilePart } from "./MultiPartUploadAPI";

interface MultiPartUploaderOptions {
    /**
     * Chunk size in MB. Must be >=5MB (enforced by AWS).
     */
    chunkSize?: number;
    /**
     * Number of parallel uploads. Must be >=5 && <=15.
     */
    parallelUploads?: number;
}

interface OnProgressCallback {
    (params: { sent: number; total: number; percentage: number }): void;
}

interface OnErrorCallback {
    (error: Error): void;
}

export class MultiPartUploader {
    private readonly api: MultiPartUploadAPI;
    private readonly chunkSize: number;
    private readonly parallelUploads: number;
    private readonly activeConnections: Map<number, XMLHttpRequest> = new Map();
    private readonly progressTracker: Map<number, number> = new Map();
    private upload: MultiPartUpload | undefined;
    private file: File | undefined;
    private onErrorFn: OnErrorCallback = error => console.error(error);
    private onProgressFn: OnProgressCallback | undefined;

    constructor(api: MultiPartUploadAPI, options: MultiPartUploaderOptions = {}) {
        this.api = api;
        const chunkSize = options.chunkSize || 50;
        const parallelUploads = options.parallelUploads || 5;

        this.chunkSize = Math.max(1024 * 1024 * chunkSize, 1024 * 1024 * 5);
        this.parallelUploads = Math.min(parallelUploads, 15);
    }

    async uploadFile(file: File) {
        this.file = file;
        const numberOfParts = Math.ceil(file.size / this.chunkSize);

        try {
            /**
             * Initialize the file upload on AWS S3.
             */
            this.upload = await this.api.createUpload({
                data: { name: file.name, size: file.size, type: file.type },
                numberOfParts
            });

            /**
             * Run the defined number of parallel uploads. Each thread will continue to process parts
             * for as long as there are parts to upload. The promise will resolve once there's no more parts to upload.
             */
            const threads = Math.min(numberOfParts, this.parallelUploads);
            await Promise.all(Array.from({ length: threads }).map(() => this.uploadNextPart()));

            await this.complete();

            return this.upload.file;
        } catch (error) {
            await this.complete(error);
            throw error;
        }
    }

    onProgress(onProgress: OnProgressCallback) {
        this.onProgressFn = onProgress;
        return this;
    }

    onError(onError: OnErrorCallback) {
        this.onErrorFn = onError;
        return this;
    }

    private async complete(error?: Error) {
        if (error) {
            this.onErrorFn(error);
            return;
        }

        try {
            await this.sendCompleteRequest();
        } catch (error) {
            this.onErrorFn(error);
        }
    }

    private async sendCompleteRequest() {
        this.assertIsDefined(
            this.upload,
            `Upload must be created before calling "sendCompleteRequest"!`
        );

        return this.api.completeUpload({
            fileKey: this.upload.file.key,
            uploadId: this.upload.uploadId
        });
    }

    private progressListener(part: FilePart, event: ProgressEvent<XMLHttpRequestEventTarget>) {
        if (!this.file) {
            return;
        }

        this.progressTracker.set(part.partNumber, event.loaded);

        const uploaded = Array.from(this.progressTracker.values()).reduce(
            (sum = 0, value) => sum + value
        );

        const uploadedSize = Math.min(uploaded, this.file.size);

        if (this.onProgressFn) {
            try {
                this.onProgressFn({
                    sent: uploadedSize,
                    total: this.file.size,
                    percentage: Math.round((uploadedSize / this.file.size) * 100)
                });
            } catch (err) {
                console.error(`Error executing the "onProgress" callback`, err);
            }
        }
    }

    private async uploadNextPart(): Promise<void> {
        if (!this.upload) {
            return;
        }

        const part = this.upload.parts.shift();

        if (!part) {
            return;
        }

        return executeWithRetry(() => this.uploadPart(part)).then(() => this.uploadNextPart());
    }

    private uploadPart(part: FilePart) {
        this.assertIsDefined(
            this.upload,
            `Upload must be created before calling "sendCompleteRequest"!`
        );

        this.assertIsDefined(this.file, `File must be set before calling "uploadPart"!`);

        const sentSize = (part.partNumber - 1) * this.chunkSize;
        const nextChunkSize = Math.min(sentSize + this.chunkSize, this.file.size);
        const chunk = this.file.slice(sentSize, nextChunkSize, this.upload.file.type);
        console.log(`Chunk for part #${part.partNumber}`, chunk.size);

        return new Promise((resolve, reject) => {
            const throwXHRError = (error: Error) => {
                this.activeConnections.delete(part.partNumber);
                reject(error);
            };

            if (!window.navigator.onLine) {
                return reject(new Error("Browser is offline!"));
            }

            const xhr = new XMLHttpRequest();
            this.activeConnections.set(part.partNumber, xhr);
            const abortXHR = () => xhr.abort();

            xhr.upload.addEventListener("progress", event => this.progressListener(part, event));

            window.addEventListener("offline", abortXHR);
            const removeListeners = () => {
                window.removeEventListener("offline", abortXHR);
            };

            xhr.open("PUT", part.url);

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    try {
                        this.activeConnections.delete(part.partNumber);
                        window.removeEventListener("offline", abortXHR);
                        resolve(xhr.status);
                    } catch (err) {
                        console.error(`Error in "onreadystatechange"`, err);
                    }
                }
            };

            xhr.onerror = () => {
                removeListeners();
                throwXHRError(new Error(`Failed to upload file part #${part.partNumber}`));
            };
            xhr.ontimeout = () => {
                removeListeners();
                throwXHRError(new Error(`Request timed out for file part #${part.partNumber}!`));
            };
            xhr.onabort = () => {
                removeListeners();
                throwXHRError(new Error(`Upload was cancelled for part #${part.partNumber}!`));
            };
            xhr.send(chunk);
        });
    }

    private assertIsDefined<T>(upload: T, message: string): asserts upload is NonNullable<T> {
        if (!upload) {
            throw new Error(message);
        }
    }
}

const executeWithRetry = (execute: () => void, options?: Parameters<typeof pRetry>[1]) => {
    return pRetry(execute, {
        maxRetryTime: 300000,
        retries: 5,
        minTimeout: 1500,
        maxTimeout: 30000,
        ...options
    });
};
