import {createAbstraction} from "@webiny/feature/api"
import type { CmsModel, CmsModelField } from "~/types/index.js";

export interface IStorageTransformToStorageParams<T, R, F extends CmsModelField> {
    model: CmsModel;
    field: F;
    value: T;
    getStorageTransform(fieldType: string): IStorageTransform<T, R, F>;
}

export interface IStorageTransformFromStorageParams<T, R, F extends CmsModelField> {
    model: CmsModel;
    field: F;
    value: T;
    getStorageTransform(fieldType: string): IStorageTransform<T, R, F>;
}


export interface IStorageTransform<T, R, F extends CmsModelField>{
    readonly fieldType: string;
    toStorage(params: IStorageTransformToStorageParams<T, R, F>): Promise<R>;
    fromStorage(params: IStorageTransformFromStorageParams<T, R, F>): Promise<T>;
}

export const StorageTransform = createAbstraction<IStorageTransform<any, any, any>>("Cms/Storage/Transform/Field");

export namespace StorageTransform {
    export type Interface<T = any, R = any, F extends CmsModelField = CmsModelField> = IStorageTransform<T, R, F>;
    export type ToStorageParams<T = any, R = any, F extends CmsModelField = CmsModelField> = IStorageTransformToStorageParams<T, R, F>;
    export type ToStorageResponse<T = any> = Promise<T>;
    export type FromStorageParams<T = any, R = any, F extends CmsModelField = CmsModelField> = IStorageTransformFromStorageParams<T, R, F>;
    export type FromStorageResponse<T = any> = Promise<T>;
}
