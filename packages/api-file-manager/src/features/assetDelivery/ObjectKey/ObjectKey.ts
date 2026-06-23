import {
    ObjectKey as ObjectKeyAbstraction,
    type IObjectKey,
    type IObjectKeyInstance
} from "./abstractions.js";

class ObjectKeyInstance implements IObjectKeyInstance {
    public static create(bucketKey: string) {
        return new ObjectKeyInstance(bucketKey);
    }

    private constructor(private readonly bucketKey: string) {}

    public id(): string {
        const [id] = this.relativeKey().split("/");
        return id;
    }

    public relativeKey(): string {
        return this.bucketKey.replace(/^tenants\/[^/]+\/files\//, "");
    }
}

class ObjectKeyImpl implements IObjectKey {
    public from(key: string): IObjectKeyInstance {
        return ObjectKeyInstance.create(key);
    }
}

export const ObjectKey = ObjectKeyAbstraction.createImplementation({
    implementation: ObjectKeyImpl,
    dependencies: []
});
