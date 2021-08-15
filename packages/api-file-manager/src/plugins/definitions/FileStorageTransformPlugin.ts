import { Plugin } from "@webiny/plugins";
import { File } from "~/types";

export interface ToParams {
    /**
     * File that is being sent to the storage operations method.
     */
    file: File & Record<string, any>;
}

export interface FromParams {
    /**
     * File that was fetched from the storage operations method.
     */
    file: File & Record<string, any>;
}

export interface Params {
    toStorage?: (params: ToParams) => Promise<File & Record<string, any>>;
    fromStorage?: (params: FromParams) => Promise<File & Record<string, any>>;
}

export class FileStorageTransformPlugin extends Plugin {
    public static readonly type = "fm.files.storage.transform";
    private readonly _params: Params;

    public constructor(params: Params) {
        super();

        this._params = params;
    }

    /**
     * Transform the file value into something that can be stored.
     * Be aware that you must return the whole file object.
     */
    public async toStorage(params: ToParams): Promise<File & Record<string, any>> {
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
    public async fromStorage(params: FromParams): Promise<File & Record<string, any>> {
        if (!this._params.fromStorage) {
            return params.file;
        }
        return this._params.fromStorage(params);
    }
}
