import { Plugin } from "@webiny/plugins";
import { File, FileManagerContext } from "~/types";

/**
 * Parameters for beforeCreate lifecycle.
 */
export interface BeforeCreateParams {
    context: FileManagerContext;
    /**
     * Data to be inserted into the storage.
     */
    data: File;
}
/**
 * Parameters for afterCreate lifecycle.
 */
export interface AfterCreateParams {
    context: FileManagerContext;
    /**
     * Data that was inserted into the storage.
     */
    data: File;
    /**
     * Result of the storage operations create method.
     * Possibly changed something on the "data".
     */
    file: File;
}
/**
 * Parameters for beforeUpdate lifecycle.
 */
export interface BeforeUpdateParams {
    context: FileManagerContext;
    /**
     * Original file from the storage.
     */
    original: File;
    /**
     * Data to be updated to the storage.
     */
    data: File;
}
/**
 * Parameters for afterUpdate lifecycle.
 */
export interface AfterUpdateParams {
    context: FileManagerContext;
    /**
     * Original file from the storage.
     */
    original: File;
    /**
     * Data that was updated in the storage.
     */
    data: File;
    /**
     * Result of the storage operations update method.
     * Possibly changed something on the "data".
     */
    file: File;
}
/**
 * Parameters for beforeBatchCreate lifecycle.
 */
export interface BeforeBatchCreateParams {
    context: FileManagerContext;
    /**
     * Files to be inserted into the storage.
     */
    data: File[];
}

/**
 * Parameters for afterBatchCreate lifecycle.
 */
export interface AfterBatchCreateParams {
    context: FileManagerContext;
    /**
     * Files that were inserted into the storage.
     */
    data: File[];
    /**
     * Results of the insert.
     */
    files: File[];
}
/**
 * Parameters for beforeDelete lifecycle.
 */
export interface BeforeDeleteParams {
    context: FileManagerContext;
    /**
     * File to be deleted from the storage.
     */
    file: File;
}
/**
 * Parameters for afterDelete lifecycle.
 */
export interface AfterDeleteParams {
    context: FileManagerContext;
    /**
     * File that was deleted from the storage.
     */
    file: File;
}

/**
 * Definition for the constructor parameters of the FilePlugin.
 *
 * @category FilePlugin
 */
export interface FilePluginParams {
    beforeCreate?: (params: BeforeCreateParams) => Promise<void>;
    afterCreate?: (params: AfterCreateParams) => Promise<void>;
    beforeUpdate?: (params: BeforeUpdateParams) => Promise<void>;
    afterUpdate?: (params: AfterUpdateParams) => Promise<void>;
    beforeBatchCreate?: (params: BeforeBatchCreateParams) => Promise<void>;
    afterBatchCreate?: (params: AfterBatchCreateParams) => Promise<void>;
    beforeDelete?: (params: BeforeDeleteParams) => Promise<void>;
    afterDelete?: (params: AfterDeleteParams) => Promise<void>;
}

export class FilePlugin extends Plugin {
    public static readonly type = "fm.file";
    private readonly _params: FilePluginParams;

    public constructor(params?: FilePluginParams) {
        super();
        this._params = params || ({} as any);
    }

    public async beforeCreate(params: BeforeCreateParams): Promise<void> {
        await this._execute("beforeCreate", params);
    }

    public async afterCreate(params: AfterCreateParams): Promise<void> {
        await this._execute("afterCreate", params);
    }

    public async beforeUpdate(params: BeforeUpdateParams): Promise<void> {
        await this._execute("beforeUpdate", params);
    }

    public async afterUpdate(params: AfterUpdateParams): Promise<void> {
        await this._execute("afterUpdate", params);
    }

    public async beforeBatchCreate(params: BeforeBatchCreateParams): Promise<void> {
        await this._execute("beforeBatchCreate", params);
    }

    public async afterBatchCreate(params: AfterBatchCreateParams): Promise<void> {
        await this._execute("afterBatchCreate", params);
    }

    public async beforeDelete(params: BeforeDeleteParams): Promise<void> {
        await this._execute("beforeDelete", params);
    }

    public async afterDelete(params: AfterDeleteParams): Promise<void> {
        await this._execute("afterDelete", params);
    }
    /**
     * Keep any here because it can be a number of params. Method is internal so no need to complicate the code.
     */
    private async _execute(callback: keyof FilePluginParams, params: any): Promise<void> {
        if (typeof this._params[callback] !== "function") {
            return;
        }
        await this._params[callback](params);
    }
}
