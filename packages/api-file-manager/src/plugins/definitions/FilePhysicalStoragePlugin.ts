import { Plugin } from "@webiny/plugins";
import WebinyError from "@webiny/error";
import { FileManagerSettings } from "~/types";

export interface FilePhysicalStoragePluginParams<
    U extends FilePhysicalStoragePluginUploadParams,
    D extends FilePhysicalStoragePluginDeleteParams
> {
    upload: (args: U) => Promise<any>;
    delete: (args: D) => Promise<void>;
}

export interface FilePhysicalStoragePluginUploadParams {
    settings: FileManagerSettings;
    buffer: Buffer;
}

export interface FilePhysicalStoragePluginDeleteParams {
    key: string;
}

export class FilePhysicalStoragePlugin<
    U extends FilePhysicalStoragePluginUploadParams = FilePhysicalStoragePluginUploadParams,
    D extends FilePhysicalStoragePluginDeleteParams = FilePhysicalStoragePluginDeleteParams
> extends Plugin {
    public static override readonly type: string = "api-file-manager-storage";
    private readonly _params: FilePhysicalStoragePluginParams<U, D>;

    public constructor(params: FilePhysicalStoragePluginParams<U, D>) {
        super();
        this._params = params;
    }

    public async upload(params: U): Promise<any> {
        if (!this._params.upload) {
            throw new WebinyError(
                `You must define the "upload" method of this plugin.`,
                "UPLOAD_METHOD_ERROR"
            );
        }
        return this._params.upload(params);
    }

    public async delete(params: D): Promise<any> {
        if (!this._params.delete) {
            throw new WebinyError(
                `You must define the "delete" method of this plugin.`,
                "DELETE_METHOD_ERROR"
            );
        }
        return this._params.delete(params);
    }
}
