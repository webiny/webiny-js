import { Plugin } from "@webiny/plugins/Plugin";
import { CmsModel, CmsModelField, CmsModelFieldType } from "~/types";
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
    fieldType: CmsModelFieldType;
    toStorage: (params: ToStorageParams<T, F>) => Promise<R>;
    fromStorage: (params: FromStorageParams<R, F>) => Promise<T>;
}
export class StorageTransformPlugin<
    T = any,
    R = any,
    F extends CmsModelField = CmsModelField
> extends Plugin {
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
