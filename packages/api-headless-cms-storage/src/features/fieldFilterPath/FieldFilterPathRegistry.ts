import type { FieldFilterPathRegistry } from "./abstractions.js";

export class FieldFilterPathRegistryImpl implements FieldFilterPathRegistry.Interface {
    private readonly handlers = new Map<string, FieldFilterPathRegistry.Handler>();

    public register(fieldType: string, handler: FieldFilterPathRegistry.Handler): void {
        this.handlers.set(fieldType, handler);
    }

    public get(fieldType: string): FieldFilterPathRegistry.Handler | undefined {
        return this.handlers.get(fieldType);
    }
}
