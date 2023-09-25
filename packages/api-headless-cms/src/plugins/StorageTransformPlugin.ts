import { Plugin } from "@webiny/plugins/Plugin";
import { CmsModel, CmsModelField } from "~/types";
import { PluginsContainer } from "@webiny/plugins";

export interface ToStorageParams<T, F extends CmsModelField> {
    model: CmsModel;
    field: F;
    value: T;
    getStoragePlugin(fieldType: string): StorageTransformPlugin<T>;
    plugins: PluginsContainer;
}

export interface FromStorageParams<T, F extends CmsModelField> {
    model: CmsModel;
    field: Partial<F> & Pick<F, "id" | "fieldId" | "storageId" | "type" | "settings">;
    value: T;
    getStoragePlugin(fieldType: string): StorageTransformPlugin<T>;
    plugins: PluginsContainer;
}

export interface StorageTransformPluginParams<T, R, F extends CmsModelField> {
    name?: string;
    fieldType: string;
    toStorage?: (params: ToStorageParams<T, F>) => Promise<R>;
    fromStorage?: (params: FromStorageParams<R, F>) => Promise<T>;
}
export class StorageTransformPlugin<
    T = any,
    R = any,
    F extends CmsModelField = CmsModelField
> extends Plugin {
    public static override readonly type: string = "cms.storage.transform.plugin";
    private readonly config: StorageTransformPluginParams<T, R, F>;

    public get fieldType(): string {
        return this.config.fieldType;
    }

    public constructor(config: StorageTransformPluginParams<T, R, F>) {
        super();
        this.name = config.name;
        this.config = config;
    }

    public hasToStorage(): boolean {
        return typeof this.config.toStorage === "function";
    }

    public toStorage(params: ToStorageParams<T, F>): Promise<R> {
        if (!this.config.toStorage) {
            return params.value as unknown as Promise<R>;
        }
        return this.config.toStorage(params);
    }

    public hasFromStorage(): boolean {
        return typeof this.config.fromStorage === "function";
    }

    public fromStorage(params: FromStorageParams<R, F>): Promise<T> {
        if (!this.config.fromStorage) {
            return params.value as unknown as Promise<T>;
        }
        return this.config.fromStorage(params);
    }
}
