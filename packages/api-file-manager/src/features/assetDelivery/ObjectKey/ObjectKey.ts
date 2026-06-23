import { ObjectKey, type IObjectKey, type IObjectKeyInstance } from "./abstractions.js";

class ObjectKeyInstance implements IObjectKeyInstance {
    constructor(private readonly bucketKey: string) {}

    id(): string {
        const [id] = this.relativeKey().split("/");
        return id;
    }

    relativeKey(): string {
        return this.bucketKey.replace(/^tenants\/[^/]+\/files\//, "");
    }
}

class ObjectKeyImpl implements IObjectKey {
    from(key: string): IObjectKeyInstance {
        return new ObjectKeyInstance(key);
    }
}

export const ObjectKeyImplementation = ObjectKey.createImplementation({
    implementation: ObjectKeyImpl,
    dependencies: []
});
