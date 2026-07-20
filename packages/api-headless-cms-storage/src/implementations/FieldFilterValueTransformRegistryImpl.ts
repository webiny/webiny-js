import type { FieldFilterValueTransformRegistry } from "../abstractions/FieldFilterValueTransformRegistry.js";

export class FieldFilterValueTransformRegistryImpl
    implements FieldFilterValueTransformRegistry.Interface
{
    private readonly handlers = new Map<string, FieldFilterValueTransformRegistry.Handler>();

    public register(fieldType: string, handler: FieldFilterValueTransformRegistry.Handler): void {
        this.handlers.set(fieldType, handler);
    }

    public get(fieldType: string): FieldFilterValueTransformRegistry.Handler | undefined {
        return this.handlers.get(fieldType);
    }
}
