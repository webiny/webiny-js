import { StorageTransform } from "../abstractions/StorageTransform.js";

class DefaultStorageTransformImpl implements StorageTransform.Interface {
    public readonly fieldType = "*";

    public async fromStorage({ value }: StorageTransform.FromStorageParams) {
        return value;
    }

    public async toStorage({ value }: StorageTransform.ToStorageParams) {
        return value;
    }
}

export const DefaultStorageTransform = StorageTransform.createImplementation({
    implementation: DefaultStorageTransformImpl,
    dependencies: []
});
