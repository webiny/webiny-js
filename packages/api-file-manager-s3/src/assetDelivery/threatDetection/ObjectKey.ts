export class ObjectKey {
    private bucketKey: string;

    static from(key: string) {
        return new ObjectKey(key);
    }

    private constructor(key: string) {
        this.bucketKey = key;
    }

    id() {
        const [id] = this.relativeKey().split("/");
        return id;
    }

    relativeKey() {
        return this.bucketKey.replace(/^tenants\/[^/]+\/files\//, "");
    }
}
