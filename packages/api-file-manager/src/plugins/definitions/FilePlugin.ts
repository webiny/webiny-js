import { Plugin } from "@webiny/plugins";
import {
    FilePluginAfterBatchCreateConfig,
    FilePluginAfterCreateConfig,
    FilePluginAfterDeleteConfig,
    FilePluginAfterUpdateConfig,
    FilePluginBeforeBatchCreateConfig,
    FilePluginBeforeCreateConfig,
    FilePluginBeforeDeleteConfig,
    FilePluginBeforeUpdateConfig,
    FilePluginConfig
} from "~/types";

export class FilePlugin extends Plugin {
    public static readonly type = "fm.file";
    private readonly _params: FilePluginConfig;

    public get field(): string {
        return this._params.field;
    }

    public constructor(params?: FilePluginConfig) {
        super();
        this._params = params || ({} as any);
    }

    public async beforeCreate(params: FilePluginBeforeCreateConfig): Promise<void> {
        if (!this._params.beforeCreate) {
            return;
        }
        return this._params.beforeCreate(params);
    }

    public async afterCreate(params: FilePluginAfterCreateConfig): Promise<void> {
        if (!this._params.afterCreate) {
            return;
        }
        return this._params.afterCreate(params);
    }

    public async beforeUpdate(params: FilePluginBeforeUpdateConfig): Promise<void> {
        if (!this._params.beforeUpdate) {
            return;
        }
        return this._params.beforeUpdate(params);
    }
    public async afterUpdate(params: FilePluginAfterUpdateConfig): Promise<void> {
        if (!this._params.afterUpdate) {
            return;
        }
        return this._params.afterUpdate(params);
    }

    public async beforeBatchCreate(params: FilePluginBeforeBatchCreateConfig): Promise<void> {
        if (!this._params.beforeBatchCreate) {
            return;
        }
        return this._params.beforeBatchCreate(params);
    }
    public async afterBatchCreate(params: FilePluginAfterBatchCreateConfig): Promise<void> {
        if (!this._params.afterBatchCreate) {
            return;
        }
        return this._params.afterBatchCreate(params);
    }

    public async beforeDelete(params: FilePluginBeforeDeleteConfig): Promise<void> {
        if (!this._params.beforeDelete) {
            return;
        }
        return this._params.beforeDelete(params);
    }
    public async afterDelete(params: FilePluginAfterDeleteConfig): Promise<void> {
        if (!this._params.afterDelete) {
            return;
        }
        return this._params.afterDelete(params);
    }
}
