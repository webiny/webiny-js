import { FileManagerContext } from "~/types";
import WebinyError from "@webiny/error";
import {
    FilePhysicalStoragePlugin,
    FilePhysicalStoragePluginUploadParams
} from "~/plugins/definitions/FilePhysicalStoragePlugin";

export type Args = {
    name: string;
    type: string;
    size: number;
    buffer: Buffer;
    keyPrefix?: string;
    hideInFileManager?: boolean;
    tags?: string[];
};

export type Result = Record<string, any>;

const storagePluginType = "api-file-manager-storage";

export interface FileStorageUploadParams extends FilePhysicalStoragePluginUploadParams {
    hideInFileManager: boolean | string;
    tags?: string[];
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
        this.storagePlugin = context.plugins
            .byType<FilePhysicalStoragePlugin>(storagePluginType)
            .pop();
        if (!this.storagePlugin) {
            throw new WebinyError(
                `Missing plugin of type "${storagePluginType}".`,
                "STORAGE_PLUGIN_ERROR"
            );
        }
        this.context = context;
    }

    async upload(params: FileStorageUploadParams): Promise<Result> {
        const settings = await this.context.fileManager.settings.getSettings();
        // Add file to cloud storage.
        const { file: fileData } = await this.storagePlugin.upload({
            ...params,
            settings
        });

        const { fileManager } = this.context;

        // Save file in DB.
        return await fileManager.files.createFile({
            ...fileData,
            meta: { private: Boolean(params.hideInFileManager) },
            tags: Array.isArray(params.tags) ? params.tags : []
        });
    }

    async uploadFiles(params: FileStorageUploadMultipleParams) {
        const settings = await this.context.fileManager.settings.getSettings();
        // Upload files to cloud storage.
        const promises = [];
        for (let i = 0; i < params.files.length; i++) {
            const item = params.files[i];
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
        return fileManager.files.createFilesInBatch(filesData);
    }

    async delete(params: FileStorageDeleteParams) {
        const { id, key } = params;
        const { fileManager } = this.context;
        // Delete file from cloud storage.
        await this.storagePlugin.delete({
            key
        });
        // Delete file from the DB.
        return await fileManager.files.deleteFile(id);
    }
}
