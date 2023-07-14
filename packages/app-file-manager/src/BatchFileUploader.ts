import { generateId } from "@webiny/utils";
import { makeAutoObservable, runInAction, action } from "mobx";
import { FileItem } from "@webiny/app-admin/types";
import { FileManagerViewContext } from "~/modules/FileManagerRenderer/FileManagerViewProvider";

export interface FileError {
    file: File;
    e: Error;
}

interface OnUploadFinishedParams {
    uploaded: FileItem[];
    errors: FileError[];
}

interface OnUploadFinishedCallback {
    (params: OnUploadFinishedParams): void;
}

class FileJob {
    public id: string;
    public file: File;

    constructor(file: File) {
        this.id = generateId();
        this.file = file;
    }
}

export class BatchFileUploader {
    private readonly uploader: FileManagerViewContext["uploadFile"];
    private fileJobs: FileJob[] = [];
    private onUploadFinishedCallback: OnUploadFinishedCallback | undefined;
    private uploading = false;
    private uploadStatus: Map<string, number> = new Map();

    constructor(uploader: FileManagerViewContext["uploadFile"]) {
        this.uploader = uploader;
        makeAutoObservable(this);
    }

    public getJobs() {
        return this.fileJobs;
    }

    public addFiles(files: File[]) {
        files.forEach(file => {
            const fileJob = new FileJob(file);
            this.fileJobs.push(fileJob);
            this.uploadStatus.set(fileJob.id, 0);
        });

        this.upload();
    }

    public reset() {
        this.fileJobs = [];
        this.uploadStatus.clear();
    }

    get progress() {
        const progressInBytes = Array.from(this.uploadStatus.values());
        const loadedBytes = progressInBytes.reduce((a, b) => a + b, 0);
        const totalBytesToUpload = this.fileJobs.reduce((sum, job) => sum + job.file.size, 0);
        return Math.min((100 * loadedBytes) / totalBytesToUpload, 100);
    }

    public onUploadFinished(cb: OnUploadFinishedCallback) {
        this.onUploadFinishedCallback = cb;
    }

    private async upload() {
        if (this.uploading) {
            return;
        }

        this.uploading = true;

        const errors: FileError[] = [];
        const uploaded: FileItem[] = [];

        while (true) {
            const fileJob = this.getNextFile();

            if (!fileJob) {
                break;
            }

            try {
                const newFile = await this.uploader(fileJob.file, {
                    onProgress: action("BatchFileUploader.onProgress", event => {
                        this.uploadStatus.set(fileJob.id, event.sent);
                    })
                });

                if (newFile) {
                    uploaded.push(newFile);
                }
            } catch (e) {
                runInAction(() => {
                    this.uploadStatus.set(fileJob.id, -1);
                });

                errors.push({ file: fileJob.file, e });
            }
        }

        runInAction(() => {
            this.uploading = false;
        });

        if (this.onUploadFinishedCallback) {
            this.onUploadFinishedCallback({ uploaded, errors });
        }
    }

    private getNextFile() {
        return this.fileJobs.find(file => this.uploadStatus.get(file.id) === 0);
    }
}
