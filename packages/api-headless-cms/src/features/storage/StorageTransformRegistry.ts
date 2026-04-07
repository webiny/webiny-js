import { StorageTransformRegistry as StorageTransformRegistryAbstraction } from "./abstractions/StorageTransformRegistry.js";
import { StorageTransform } from "~/features/storage/abstractions/StorageTransform.js";
import type { CmsModelField } from "~/types/index.js";
import { getBaseFieldType } from "~/utils/getBaseFieldType.js";

class StorageTransformRegistryImpl implements StorageTransformRegistryAbstraction.Interface {
    public constructor(private readonly transforms: StorageTransform.Interface[]) {}

    public get<T = any, R = any, F extends CmsModelField = CmsModelField>(
        fieldType: string
    ): StorageTransform.Interface<T, R, F> | undefined {
        const baseType = getBaseFieldType({
            type: fieldType
        });
        return this.transforms.find((item): item is StorageTransform.Interface<T, R, F> => {
            return item.fieldType === baseType;
        });
    }

    public getAll(): StorageTransform.Interface[] {
        return [];
    }
}

export const StorageTransformRegistry = StorageTransformRegistryAbstraction.createImplementation({
    implementation: StorageTransformRegistryImpl,
    dependencies: [[StorageTransform, { multiple: true }]]
});
