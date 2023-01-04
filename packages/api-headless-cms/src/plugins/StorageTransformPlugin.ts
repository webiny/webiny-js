import { Plugin } from "@webiny/plugins/Plugin";
import { CmsModel, CmsModelField } from "~/types";
import { PluginsContainer } from "@webiny/plugins";

export interface ToStorageParams<T, F> {
    model: CmsModel;
    field: F;
    value: T;
    getStoragePlugin(fieldType: string): StorageTransformPlugin<T>;
    plugins: PluginsContainer;
}

export interface FromStorageParams<T, F extends CmsModelField> {
    model: CmsModel;
    field: Partial<F> &
        Pick<F, "id" | "fieldId" | "storageId" | "type" | "settings">;
    value: T;
    getStoragePlugin(fieldType: string): StorageTransformPlugin<T>;
    plugins: PluginsContainer;
}

export interface StorageTransformPluginParams<T, R, F> {
    name?: string;
    fieldType: string;
    toStorage: (params: ToStorageParams<T, F>) => Promise<R>;
    fromStorage: (params: FromStorageParams<R, F>) => Promise<T>;
}
export class StorageTransformPlugin<T = any, R = any, F = CmsModelField> extends Plugin {
    public static override readonly type: string = "cms.storage.transform.plugin";
    public get fieldType(): string {
        return this.config.fieldType;
    }

    private readonly config: StorageTransformPluginParams<T, R, F>;

    public constructor(config: StorageTransformPluginParams<T, R, F>) {
        super();
        this.name = config.name;
        this.config = config;
    }

    public toStorage(params: ToStorageParams<T, F>): Promise<R> {
        return this.config.toStorage(params);
    }

    public fromStorage(params: FromStorageParams<R, F>): Promise<T> {
        return this.config.fromStorage(params);
    }
}
