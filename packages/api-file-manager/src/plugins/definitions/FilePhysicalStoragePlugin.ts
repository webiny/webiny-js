import { Plugin } from "@webiny/plugins";
import WebinyError from "@webiny/error";
import { FileManagerSettings } from "~/types";

export interface Params {
    upload: (args: UploadParams) => Promise<any>;
    delete: (args: DeleteParams) => Promise<void>;
}

export interface UploadParams {
    settings: FileManagerSettings;
    buffer: Buffer;
    [key: string]: any;
}

export interface DeleteParams {
    key: string;
}

export class FilePhysicalStoragePlugin extends Plugin {
    public static readonly type = "fm.files.physicalStorage";
    private readonly _params: Params;

    public constructor(params: Params) {
        super();
        this._params = params;
    }

    public async upload(params: UploadParams): Promise<any> {
        if (!this._params.upload) {
            throw new WebinyError(
                `You must define the "upload" method of this plugin.`,
                "UPLOAD_METHOD_ERROR"
            );
        }
        return this._params.upload(params);
    }

    public async delete(params: DeleteParams): Promise<any> {
        if (!this._params.delete) {
            throw new WebinyError(
                `You must define the "delete" method of this plugin.`,
                "DELETE_METHOD_ERROR"
            );
        }
        return this._params.delete(params);
    }
}
