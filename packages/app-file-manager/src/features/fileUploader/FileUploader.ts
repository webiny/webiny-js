import { makeAutoObservable, computed, runInAction } from "mobx";
import { WebinySdk } from "@webiny/app-admin/features/webinySdk/abstractions.js";
import { FilesListCache, FileFieldsProvider } from "../shared/abstractions.js";
import {
    FileUploader as Abstraction,
    type UploadJob,
    type UploadFileData,
    type FileUploaderViewModel,
    type BatchUploadOptions
} from "./abstractions.js";

let jobCounter = 0;

function createJobId(): string {
    return `upload-${++jobCounter}-${Date.now()}`;
}

class FileUploaderImpl implements Abstraction.Interface {
    private jobs: UploadJob[] = [];
    private abortControllers = new Map<string, AbortController>();

    constructor(
        private sdk: WebinySdk.Interface,
        private cache: FilesListCache.Interface,
        private fileFieldsProvider: FileFieldsProvider.Interface
    ) {
        makeAutoObservable<
            FileUploaderImpl,
            "sdk" | "cache" | "fileFieldsProvider" | "abortControllers"
        >(this, {
            sdk: false,
            cache: false,
            fileFieldsProvider: false,
            abortControllers: false,
            vm: computed
        });
    }

    get vm(): FileUploaderViewModel {
        const jobs = [...this.jobs];
        const uploading = jobs.filter(j => j.status === "uploading" || j.status === "pending");
        const completed = jobs.filter(j => j.status === "completed");
        const failed = jobs.filter(j => j.status === "failed");

        let sent = 0;
        let total = 0;
        for (const job of jobs) {
            sent += job.progress.sent;
            total += job.progress.total;
        }

        return {
            jobs,
            overallProgress: {
                sent,
                total,
                percentage: total > 0 ? Math.round((sent / total) * 100) : 0
            },
            isUploading: uploading.length > 0,
            completedCount: completed.length,
            failedCount: failed.length
        };
    }

    async upload(file: File, data: UploadFileData): Promise<void> {
        const fileFields = await this.fileFieldsProvider.execute();
        const jobId = createJobId();
        const controller = new AbortController();
        this.abortControllers.set(jobId, controller);

        const job: UploadJob = {
            id: jobId,
            fileName: data.name,
            status: "uploading",
            progress: { sent: 0, total: file.size, percentage: 0 }
        };

        runInAction(() => {
            this.jobs.push(job);
        });

        try {
            const result = await this.sdk.fileManager.createFile({
                file,
                data,
                fields: fileFields,
                onProgress: progress => {
                    runInAction(() => {
                        const idx = this.jobs.findIndex(j => j.id === jobId);
                        if (idx !== -1) {
                            this.jobs[idx] = {
                                ...this.jobs[idx],
                                progress: {
                                    sent: progress.sent,
                                    total: progress.total,
                                    percentage: progress.percentage
                                }
                            };
                        }
                    });
                },
                signal: controller.signal
            });

            if (result.isFail()) {
                throw new Error(result.error.message);
            }

            runInAction(() => {
                const idx = this.jobs.findIndex(j => j.id === jobId);
                if (idx !== -1) {
                    this.jobs[idx] = {
                        ...this.jobs[idx],
                        status: "completed",
                        progress: { sent: file.size, total: file.size, percentage: 100 },
                        result: result.value
                    };
                }
                this.cache.addItems([result.value]);
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            runInAction(() => {
                const idx = this.jobs.findIndex(j => j.id === jobId);
                if (idx !== -1) {
                    this.jobs[idx] = {
                        ...this.jobs[idx],
                        status: "failed",
                        error: message
                    };
                }
            });
        } finally {
            this.abortControllers.delete(jobId);
        }
    }

    async uploadMany(
        files: Array<{ file: File; data: UploadFileData }>,
        options?: BatchUploadOptions
    ): Promise<void> {
        const fileFields = await this.fileFieldsProvider.execute();
        const controller = new AbortController();

        // Create jobs for each file.
        const jobIds: string[] = [];
        runInAction(() => {
            for (const entry of files) {
                const jobId = createJobId();
                jobIds.push(jobId);
                this.abortControllers.set(jobId, controller);
                this.jobs.push({
                    id: jobId,
                    fileName: entry.data.name,
                    status: "pending",
                    progress: { sent: 0, total: entry.file.size, percentage: 0 }
                });
            }
        });

        // Build SDK params with per-file onProgress callbacks.
        const sdkFiles = files.map((entry, index) => ({
            file: entry.file,
            data: entry.data,
            fields: fileFields,
            onProgress: (progress: { sent: number; total: number; percentage: number }) => {
                runInAction(() => {
                    const jobId = jobIds[index];
                    const idx = this.jobs.findIndex(j => j.id === jobId);
                    if (idx !== -1) {
                        this.jobs[idx] = {
                            ...this.jobs[idx],
                            status: "uploading",
                            progress: {
                                sent: progress.sent,
                                total: progress.total,
                                percentage: progress.percentage
                            }
                        };
                    }
                });
            }
        }));

        try {
            const result = await this.sdk.fileManager.createFiles({
                files: sdkFiles,
                concurrency: options?.concurrency,
                strategy: options?.strategy as any,
                signal: controller.signal
            });

            if (result.isFail()) {
                throw new Error(result.error.message);
            }

            const { successful, failed } = result.value;

            runInAction(() => {
                // Mark successful jobs.
                for (const file of successful) {
                    // Match by name since SDK doesn't return our jobId.
                    const jobId = jobIds.find(id => {
                        const job = this.jobs.find(j => j.id === id);
                        return job && job.fileName === file.name && job.status !== "completed";
                    });
                    if (jobId) {
                        const idx = this.jobs.findIndex(j => j.id === jobId);
                        if (idx !== -1) {
                            this.jobs[idx] = {
                                ...this.jobs[idx],
                                status: "completed",
                                progress: {
                                    sent: this.jobs[idx].progress.total,
                                    total: this.jobs[idx].progress.total,
                                    percentage: 100
                                },
                                result: file
                            };
                        }
                    }
                }

                // Mark failed jobs.
                for (const failure of failed) {
                    const jobId = jobIds.find(id => {
                        const job = this.jobs.find(j => j.id === id);
                        return job && job.fileName === failure.data.name && job.status !== "failed";
                    });
                    if (jobId) {
                        const idx = this.jobs.findIndex(j => j.id === jobId);
                        if (idx !== -1) {
                            this.jobs[idx] = {
                                ...this.jobs[idx],
                                status: "failed",
                                error: failure.error.message
                            };
                        }
                    }
                }

                // Update cache with all successful files.
                if (successful.length > 0) {
                    this.cache.addItems(successful);
                }
            });
        } catch (error) {
            // Fail-fast: mark all pending/uploading jobs as failed.
            const message = error instanceof Error ? error.message : "Unknown error";
            runInAction(() => {
                for (const jobId of jobIds) {
                    const idx = this.jobs.findIndex(j => j.id === jobId);
                    if (idx !== -1 && this.jobs[idx].status !== "completed") {
                        this.jobs[idx] = {
                            ...this.jobs[idx],
                            status: "failed",
                            error: message
                        };
                    }
                }
            });
        } finally {
            for (const jobId of jobIds) {
                this.abortControllers.delete(jobId);
            }
        }
    }

    abort(jobId: string): void {
        const controller = this.abortControllers.get(jobId);
        if (controller) {
            controller.abort();
            this.abortControllers.delete(jobId);
        }
    }

    clear(): void {
        runInAction(() => {
            this.jobs = this.jobs.filter(j => j.status !== "completed" && j.status !== "failed");
        });
    }
}

export const FileUploader = Abstraction.createImplementation({
    implementation: FileUploaderImpl,
    dependencies: [WebinySdk, FilesListCache, FileFieldsProvider]
});
