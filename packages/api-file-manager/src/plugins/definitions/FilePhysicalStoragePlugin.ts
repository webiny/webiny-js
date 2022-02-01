import { Plugin } from "@webiny/plugins";
import WebinyError from "@webiny/error";
import { FileManagerSettings } from "~/types";

export interface FilePhysicalStoragePluginParams {
    upload: (args: FilePhysicalStoragePluginUploadParams) => Promise<any>;
    delete: (args: FilePhysicalStoragePluginDeleteParams) => Promise<void>;
}

export interface FilePhysicalStoragePluginUploadParams {
    settings: FileManagerSettings;
    buffer: Buffer;
}

export interface FilePhysicalStoragePluginDeleteParams {
    key: string;
}

export class FilePhysicalStoragePlugin extends Plugin {
    public static readonly type = "api-file-manager-storage";
    private readonly _params: FilePhysicalStoragePluginParams;

    public constructor(params: FilePhysicalStoragePluginParams) {
        super();
        this._params = params;
    }

    public async upload(params: FilePhysicalStoragePluginUploadParams): Promise<any> {
        if (!this._params.upload) {
            throw new WebinyError(
                `You must define the "upload" method of this plugin.`,
                "UPLOAD_METHOD_ERROR"
            );
        }
        return this._params.upload(params);
    }

    public async delete(params: FilePhysicalStoragePluginDeleteParams): Promise<any> {
        if (!this._params.delete) {
            throw new WebinyError(
                `You must define the "delete" method of this plugin.`,
                "DELETE_METHOD_ERROR"
            );
        }
        return this._params.delete(params);
    }
}
