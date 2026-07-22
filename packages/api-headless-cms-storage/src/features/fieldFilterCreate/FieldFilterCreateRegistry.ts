import WebinyError from "@webiny/error";
import type { FieldFilterCreateRegistry } from "./abstractions.js";

export class FieldFilterCreateRegistryImpl implements FieldFilterCreateRegistry.Interface {
    private readonly handlers = new Map<string, FieldFilterCreateRegistry.Handler>();

    public register(fieldType: string, handler: FieldFilterCreateRegistry.Handler): void {
        this.handlers.set(fieldType, handler);
    }

    public get(fieldType: string): FieldFilterCreateRegistry.Handler | undefined {
        return this.handlers.get(fieldType);
    }

    public getDefault(): FieldFilterCreateRegistry.Handler {
        const handler = this.handlers.get("*");
        if (!handler) {
            throw new WebinyError(
                "No default filter create handler registered.",
                "MISSING_DEFAULT_HANDLER"
            );
        }
        return handler;
    }
}
