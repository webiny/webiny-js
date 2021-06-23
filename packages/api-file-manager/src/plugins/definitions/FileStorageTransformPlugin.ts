import { Plugin } from "@webiny/plugins";
import {
    File,
    FileStorageTransformFromConfig,
    FileStorageTransformPluginConfig,
    FileStorageTransformToConfig
} from "~/types";

export class FileStorageTransformPlugin extends Plugin {
    public static readonly type = "fm.file.storage";
    private readonly _params: FileStorageTransformPluginConfig;

    public constructor(params: FileStorageTransformPluginConfig) {
        super();

        this._params = params;
    }

    /**
     * Transform the file value into something that can be stored.
     * Be aware that you must return the whole file object.
     */
    public async toStorage(
        params: FileStorageTransformToConfig
    ): Promise<File & Record<string, any>> {
        if (!this._params.toStorage) {
            return params.file;
        }
        return this._params.toStorage(params);
    }
    /**
     * Transform the file value from the storage type to one required by our system.
     * Be aware that you must return the whole file object.
     * This method MUST reverse what ever toStorage method changed on the file object.
     */
    public async fromStorage(
        params: FileStorageTransformFromConfig
    ): Promise<File & Record<string, any>> {
        if (!this._params.fromStorage) {
            return params.file;
        }
        return this._params.fromStorage(params);
    }
}
