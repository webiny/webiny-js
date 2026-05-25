import { SchemaRegistryAbstraction } from "./abstractions.js";

class SchemaRegistryImpl implements SchemaRegistryAbstraction.Interface {
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

export const SchemaRegistry = SchemaRegistryAbstraction.createImplementation({
    implementation: SchemaRegistryImpl,
    dependencies: []
});
