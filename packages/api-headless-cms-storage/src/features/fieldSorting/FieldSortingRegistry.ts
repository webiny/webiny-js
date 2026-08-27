import type { FieldSortingRegistry } from "./abstractions.js";

export class FieldSortingRegistryImpl implements FieldSortingRegistry.Interface {
    private readonly handlers: FieldSortingRegistry.Handler[] = [];

    public register(handler: FieldSortingRegistry.Handler): void {
        this.handlers.push(handler);
    }

    public find(
        params: FieldSortingRegistry.CanUseParams
    ): FieldSortingRegistry.Handler | undefined {
        for (let i = this.handlers.length - 1; i >= 0; i--) {
            if (this.handlers[i].canUse(params)) {
                return this.handlers[i];
            }
        }
        return undefined;
    }
}
