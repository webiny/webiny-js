import { Plugin } from "@webiny/plugins";
import { File } from "~/types";

/**
 * Parameters for beforeCreate lifecycle.
 */
export interface BeforeCreateParams {
    /**
     * Data to be inserted into the storage.
     */
    data: File;
}
/**
 * Parameters for afterCreate lifecycle.
 */
export interface AfterCreateParams {
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
    /**
     * Files to be inserted into the storage.
     */
    data: File[];
}

/**
 * Parameters for afterBatchCreate lifecycle.
 */
export interface AfterBatchCreateParams {
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
    /**
     * File to be deleted from the storage.
     */
    file: File;
}
/**
 * Parameters for afterDelete lifecycle.
 */
export interface AfterDeleteParams {
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
export interface Params {
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
    private readonly _params: Params;

    public constructor(params?: Params) {
        super();
        this._params = params || ({} as any);
    }

    public async beforeCreate(params: BeforeCreateParams): Promise<void> {
        if (!this._params.beforeCreate) {
            return;
        }
        return this._params.beforeCreate(params);
    }

    public async afterCreate(params: AfterCreateParams): Promise<void> {
        if (!this._params.afterCreate) {
            return;
        }
        return this._params.afterCreate(params);
    }

    public async beforeUpdate(params: BeforeUpdateParams): Promise<void> {
        if (!this._params.beforeUpdate) {
            return;
        }
        return this._params.beforeUpdate(params);
    }
    public async afterUpdate(params: AfterUpdateParams): Promise<void> {
        if (!this._params.afterUpdate) {
            return;
        }
        return this._params.afterUpdate(params);
    }

    public async beforeBatchCreate(params: BeforeBatchCreateParams): Promise<void> {
        if (!this._params.beforeBatchCreate) {
            return;
        }
        return this._params.beforeBatchCreate(params);
    }
    public async afterBatchCreate(params: AfterBatchCreateParams): Promise<void> {
        if (!this._params.afterBatchCreate) {
            return;
        }
        return this._params.afterBatchCreate(params);
    }

    public async beforeDelete(params: BeforeDeleteParams): Promise<void> {
        if (!this._params.beforeDelete) {
            return;
        }
        return this._params.beforeDelete(params);
    }
    public async afterDelete(params: AfterDeleteParams): Promise<void> {
        if (!this._params.afterDelete) {
            return;
        }
        return this._params.afterDelete(params);
    }
}
