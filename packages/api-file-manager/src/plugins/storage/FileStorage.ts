import { FileManagerContext } from "~/types";

export type Args = {
    name: string;
    type: string;
    size: number;
    buffer: Buffer;
    keyPrefix?: string;
};

export type Result = Record<string, any>;

export interface FileStoragePlugin {
    upload: (args: Args) => Promise<Result>;
    delete: (args: { key: string }) => Promise<void>;
}

export class FileStorage {
    storagePlugin: FileStoragePlugin;
    context: FileManagerContext;
    constructor({ context }) {
        // Get file storage plugin. We get it `byName` because we only support 1 storage plugin.
        this.storagePlugin = context.plugins.byName("api-file-manager-storage");
        this.context = context;
    }

    async upload(args): Promise<Result> {
        const settings = await this.context.fileManager.settings.getSettings();
        // Add file to cloud storage.
        const { file: fileData } = await this.storagePlugin.upload({
            ...args,
            settings
        });

        const { fileManager } = this.context;

        // Save file in DB.
        return await fileManager.files.createFile({
            ...fileData,
            meta: { private: Boolean(args.hideInFileManager) }
        });
    }

    async uploadFiles(args) {
        const settings = await this.context.fileManager.settings.getSettings();
        // Upload files to cloud storage.
        const promises = [];
        for (let i = 0; i < args.files.length; i++) {
            const item = args.files[i];
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

    async delete(args) {
        const { id, key } = args;
        const { fileManager } = this.context;
        // Delete file from cloud storage.
        await this.storagePlugin.delete({
            key
        });
        // Delete file from the DB.
        await fileManager.files.deleteFile(id);
    }
}
