import { SchemaRegistry } from "./abstractions/index.js";

class SchemaRegistryImpl implements SchemaRegistry.Interface {
    private readonly verified: Set<string> = new Set();

    public isVerified(tableName: string): boolean {
        return this.verified.has(tableName);
    }

    public markVerified(tableName: string): void {
        this.verified.add(tableName);
    }

    public removeVerified(tableName: string): void {
        this.verified.delete(tableName);
    }
}

export const SchemaRegistryImplementation = SchemaRegistry.createImplementation({
    implementation: SchemaRegistryImpl,
    dependencies: []
});
