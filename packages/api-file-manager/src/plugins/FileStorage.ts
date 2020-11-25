import { ContextPlugin } from "@webiny/handler/types";

export type Args = {
    name: string;
    type: string;
    size: number;
    buffer: Buffer;
    settings?: Record<string, any>;
    keyPrefix?: string;
};

type FileManagerSettings = {
    uploadMinFileSize: number;
    uploadMaxFileSize: number;
};

export type Result = Record<string, any>;

export interface FileStoragePlugin {
    upload: (args: Args) => Promise<Result>;
    delete: (args: { key: string }) => Promise<void>;
}

export class FileStorage {
    storagePlugin: FileStoragePlugin;
    settings: FileManagerSettings;
    context: ContextPlugin<FileStorageContext>;
    constructor({ storagePlugin, settings, context }) {
        this.storagePlugin = storagePlugin;
        this.settings = settings;
        this.context = context;
    }

    async upload(args): Promise<Result> {
        // Cloud storage provider logic.
        const { file: fileData } = await this.storagePlugin.upload({
            ...args,
            settings: args.settings || this.settings
        });

        // Database logic.
        const { files, elasticSearch } = this.context;
        // Save file in DB.
        const file = await files.create({
            ...fileData,
            meta: { private: Boolean(args.hideInFileManager) }
        });
        // Index file in "Elastic Search"
        await elasticSearch.create({
            id: file.id,
            index: "file-manager",
            type: "_doc",
            body: {
                id: file.id,
                createdOn: file.createdOn,
                key: file.key,
                size: file.size,
                type: file.type,
                name: file.name,
                tags: file.tags,
                createdBy: file.createdBy,
                meta: file.meta
            }
        });

        return file;
    }

    async uploadFiles(args) {
        const { files, elasticSearch } = this.context;

        const promises = [];
        for (let i = 0; i < args.files.length; i++) {
            const item = args.files[i];
            promises.push(
                this.storagePlugin.upload({
                    ...item,
                    settings: args.settings || this.settings
                })
            );
        }
        // Wait for all to resolve.
        const uploadFileResponses = await Promise.all(promises);

        const filesData = uploadFileResponses.map(response => response.file);

        const data = await files.createInBatch(filesData);

        const body = data.flatMap(doc => [{ index: { _index: "file-manager" } }, getFileDoc(doc)]);

        const { body: bulkResponse } = await elasticSearch.bulk({ body });
        if (bulkResponse.errors) {
            const erroredDocuments = [];
            // The items array has the same order of the dataset we just indexed.
            // The presence of the `error` key indicates that the operation
            // that we did for the document has failed.
            bulkResponse.items.forEach((action, i) => {
                const operation = Object.keys(action)[0];
                if (action[operation].error) {
                    erroredDocuments.push({
                        // If the status is 429 it means that you can retry the document,
                        // otherwise it's very likely a mapping error, and you should
                        // fix the document before to try it again.
                        status: action[operation].status,
                        error: action[operation].error,
                        operation: body[i * 2],
                        document: body[i * 2 + 1]
                    });
                }
            });
        }

        return data;
    }

    async delete(args) {
        const { id, key } = args;
        const { files, elasticSearch } = this.context;
        // Cloud storage provider logic.
        await this.storagePlugin.delete({
            key
        });

        // DB
        await files.delete(id);
        // Index file in "Elastic Search"
        await elasticSearch.delete({
            id,
            index: "file-manager",
            type: "_doc"
        });
    }
}

export type FileStorageContext = {
    storage: FileStorage;
};

const getFileDoc = file => ({
    id: file.id,
    createdOn: file.createdOn,
    key: file.key,
    size: file.size,
    type: file.type,
    name: file.name,
    tags: file.tags,
    createdBy: file.createdBy
});
