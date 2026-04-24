import { createAbstraction } from "@webiny/feature/api";
import { StorageTransform } from "./StorageTransform.js";
import type { CmsModelField } from "~/types/index.js";

export interface IStorageTransformRegistry {
    get<T = any, R = any, F extends CmsModelField = CmsModelField>(
        fieldType: string
    ): StorageTransform.Interface<T, R, F> | undefined;
    getAll(): StorageTransform.Interface[];
}

export const StorageTransformRegistry = createAbstraction<IStorageTransformRegistry>(
    "Cms/Storage/Transform/Registry"
);

export namespace StorageTransformRegistry {
    export type Interface = IStorageTransformRegistry;
}
