import { RawAssumedRole as Abstraction } from "./abstractions.js";
import type { IRawAssumedRole } from "./abstractions.js";

/**
 * Per-request holder for the transport-extracted assume-role request. Registered per request, so a
 * fresh instance holds the value for the current request only.
 */
class RawAssumedRoleImpl implements IRawAssumedRole {
    private value: Abstraction.Request | null = null;

    get(): Abstraction.Request | null {
        return this.value;
    }

    set(value: Abstraction.Request | null): void {
        this.value = value;
    }
}

export const RawAssumedRole = Abstraction.createImplementation({
    implementation: RawAssumedRoleImpl,
    dependencies: []
});
