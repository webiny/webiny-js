import { StorageTransformRegistry as StorageTransformRegistryAbstraction } from "./abstractions/StorageTransformRegistry.js";
import { StorageTransform } from "~/features/storage/abstractions/StorageTransform.js";
import type { CmsModelField } from "~/types/index.js";
import { getBaseFieldType } from "~/utils/getBaseFieldType.js";

class StorageTransformRegistryImpl implements StorageTransformRegistryAbstraction.Interface {
    private readonly cache: Map<string, StorageTransform.Interface | undefined> = new Map();

    public constructor(private readonly transforms: StorageTransform.Interface[]) {}

    public get<T = any, R = any, F extends CmsModelField = CmsModelField>(
        fieldType: string
    ): StorageTransform.Interface<T, R, F> | undefined {
        if (this.cache.has(fieldType)) {
            return this.cache.get(fieldType) as StorageTransform.Interface<T, R, F>;
        }

        const baseType = getBaseFieldType({
            type: fieldType
        });
        let transform = this.transforms.find(
            (item): item is StorageTransform.Interface<T, R, F> => {
                return item.fieldType === fieldType;
            }
        );

        if (!transform) {
            transform = this.transforms.find(
                (item): item is StorageTransform.Interface<T, R, F> => {
                    return item.fieldType === baseType;
                }
            );
        }
        this.cache.set(fieldType, transform);
        return transform;
    }

    public getAll(): StorageTransform.Interface[] {
        return this.transforms;
    }
}

export const StorageTransformRegistry = StorageTransformRegistryAbstraction.createImplementation({
    implementation: StorageTransformRegistryImpl,
    dependencies: [[StorageTransform, { multiple: true }]]
});
