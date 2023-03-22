import { FileManagerContext } from "~/types";
import WebinyError from "@webiny/error";
import { FilePhysicalStoragePlugin } from "~/plugins/FilePhysicalStoragePlugin";

export type Result = Record<string, any>;

const storagePluginType = "api-file-manager-storage";

export interface FileStorageUploadParams {
    buffer: Buffer;
    hideInFileManager: boolean | string;
    tags?: string[];
    size: number;
    name: string;
    keyPrefix: string;
    type: string;
}
export interface FileStorageDeleteParams {
    id: string;
    key: string;
}

export interface FileStorageUploadMultipleParams {
    files: FileStorageUploadParams[];
}

export interface FileStorageParams {
    context: FileManagerContext;
}
export class FileStorage {
    private readonly storagePlugin: FilePhysicalStoragePlugin;
    private readonly context: FileManagerContext;

    constructor({ context }: FileStorageParams) {
        const storagePlugin = context.plugins
            .byType<FilePhysicalStoragePlugin>(storagePluginType)
            .pop();

        if (!storagePlugin) {
            throw new WebinyError(
                `Missing plugin of type "${storagePluginType}".`,
                "STORAGE_PLUGIN_ERROR"
            );
        }
        this.storagePlugin = storagePlugin;
        this.context = context;
    }

    async upload(params: FileStorageUploadParams): Promise<Result> {
        const settings = await this.context.fileManager.getSettings();
        if (!settings) {
            throw new WebinyError("Missing File Manager Settings.", "FILE_MANAGER_ERROR");
        }
        // Add file to cloud storage.
        const { file: fileData } = await this.storagePlugin.upload({
            ...params,
            settings
        });

        const { fileManager } = this.context;

        // Save file in DB.
        return await fileManager.createFile({
            ...(fileData as any),
            meta: {
                private: Boolean(params.hideInFileManager)
            },
            tags: Array.isArray(params.tags) ? params.tags : []
        });
    }

    async uploadFiles(params: FileStorageUploadMultipleParams) {
        const settings = await this.context.fileManager.getSettings();
        if (!settings) {
            throw new WebinyError("Missing File Manager Settings.", "FILE_MANAGER_ERROR");
        }
        // Upload files to cloud storage.
        const promises = [];
        for (const item of params.files) {
            promises.push(
                this.storagePlugin.upload({
                    ...item,
                    settings
                })
            );
        }
        // Wait for all to resolve.
        const uploadFileResponses = await Promise.all(promises);

        const filesData = uploadFileResponses.map(response => response.file);

        const { fileManager } = this.context;
        // Save files in DB.
        return fileManager.createFilesInBatch(filesData);
    }

    async delete(params: FileStorageDeleteParams) {
        const { id, key } = params;
        const { fileManager } = this.context;
        // Delete file from cloud storage.
        await this.storagePlugin.delete({
            key
        });

        // Delete file from the DB.
        return await fileManager.deleteFile(id);
    }
}
