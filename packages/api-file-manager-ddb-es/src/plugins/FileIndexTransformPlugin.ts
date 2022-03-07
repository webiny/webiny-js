import { Plugin } from "@webiny/plugins";
import { File } from "@webiny/api-file-manager/types";
import {
    FileIndexTransformFromConfig,
    FileIndexTransformPluginConfig,
    FileIndexTransformToConfig
} from "~/types";

export class FileIndexTransformPlugin extends Plugin {
    public static override readonly type: string = "fm.ddbEs.file.index";
    private readonly _params: FileIndexTransformPluginConfig;

    public constructor(params: FileIndexTransformPluginConfig) {
        super();

        this._params = params;
    }

    /**
     * Be aware that you must return the whole file object.
     */
    public async toIndex(params: FileIndexTransformToConfig): Promise<File> {
        if (!this._params.toIndex) {
            return params.file;
        }
        return this._params.toIndex(params);
    }
    /**
     * Be aware that you must return the whole file object.
     * This method MUST reverse what ever toIndex method changed on the file object.
     */
    public async fromIndex(params: FileIndexTransformFromConfig): Promise<File> {
        if (!this._params.fromIndex) {
            return params.file;
        }
        return this._params.fromIndex(params);
    }
}
