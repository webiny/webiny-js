import { RawTenantId as Abstraction } from "./abstractions.js";
import type { IRawTenantId } from "./abstractions.js";

/**
 * Per-request holder for the transport-extracted raw tenant id. Registered per request, so a fresh
 * instance holds the value for the current request only.
 */
class RawTenantIdImpl implements IRawTenantId {
    private value: string | null = null;

    get(): string | null {
        return this.value;
    }

    set(id: string | null): void {
        this.value = id;
    }
}

export const RawTenantId = Abstraction.createImplementation({
    implementation: RawTenantIdImpl,
    dependencies: []
});
