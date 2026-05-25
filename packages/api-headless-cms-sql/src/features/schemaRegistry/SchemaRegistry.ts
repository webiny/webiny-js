import { SchemaRegistry as SchemaRegistryAbstraction } from "./abstractions.js";

class SchemaRegistryImpl implements SchemaRegistryAbstraction.Interface {
    private readonly verified: Set<string> = new Set();
    private version = 0;

    private checkReset(): void {
        const globalVersion = (globalThis as Record<string, unknown>).__schemaRegistryVersion as
            | number
            | undefined;
        if (globalVersion && globalVersion !== this.version) {
            this.verified.clear();
            this.version = globalVersion;
        }
    }

    public isVerified(tableName: string): boolean {
        this.checkReset();
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
