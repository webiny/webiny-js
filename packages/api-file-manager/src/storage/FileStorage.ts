// @ts-nocheck TODO: remove this file
import type { FileManagerContext } from "~/types.js";
import WebinyError from "@webiny/error";
import type { FilePhysicalStoragePlugin } from "~/plugins/FilePhysicalStoragePlugin.js";


/**
 * TODO: implement this via a separate service to delete file from storage.
 * TODO: The service should be called as an event handled on successful file deletion from DB
 */

export class FileStorage {
    private readonly context: FileManagerContext;

    constructor({ context }: FileStorageParams) {
        this.context = context;
    }

    get storagePlugin() {
        const storagePlugin = this.context.plugins
            .byType<FilePhysicalStoragePlugin>(storagePluginType)
            .pop();

        if (!storagePlugin) {
            throw new WebinyError(
                `Missing plugin of type "${storagePluginType}".`,
                "STORAGE_PLUGIN_ERROR"
            );
        }

        return storagePlugin;
    }
}
