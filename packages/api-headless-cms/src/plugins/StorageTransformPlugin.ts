import { Plugin } from "@webiny/plugins/Plugin";
import { CmsModel, CmsModelField } from "~/types";
import { PluginsContainer } from "@webiny/plugins";

export interface ToStorageParams<T> {
    model: CmsModel;
    field: CmsModelField;
    value: T;
    getStoragePlugin(fieldType: string): StorageTransformPlugin<T>;
    plugins: PluginsContainer;
}

export interface FromStorageParams<T> {
    model: CmsModel;
    field: CmsModelField;
    value: T;
    getStoragePlugin(fieldType: string): StorageTransformPlugin<T>;
    plugins: PluginsContainer;
}

export interface StorageTransformPluginParams<T, R> {
    name?: string;
    fieldType: string;
    toStorage: (params: ToStorageParams<T>) => Promise<R>;
    fromStorage: (params: FromStorageParams<R>) => Promise<T>;
}
export class StorageTransformPlugin<T = any, R = any> extends Plugin {
    public static override readonly type: string = "cms.storage.transform.plugin";
    public get fieldType(): string {
        return this.config.fieldType;
    }

    private readonly config: StorageTransformPluginParams<T, R>;

    public constructor(config: StorageTransformPluginParams<T, R>) {
        super();
        this.name = config.name;
        this.config = config;
    }

    public toStorage(params: ToStorageParams<T>): Promise<R> {
        return this.config.toStorage(params);
    }

    public fromStorage(params: FromStorageParams<R>): Promise<T> {
        return this.config.fromStorage(params);
    }
}
