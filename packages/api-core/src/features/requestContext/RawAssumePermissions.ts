import { RawAssumePermissions as Abstraction } from "./abstractions.js";

/**
 * Per-request holder for the transport-extracted preview target. Registered per request, so a
 * fresh instance holds the value for the current request only.
 */
class RawAssumePermissionsImpl implements Abstraction.Interface {
    private value: Abstraction.Target | null = null;

    get(): Abstraction.Target | null {
        return this.value;
    }

    set(value: Abstraction.Target | null): void {
        this.value = value;
    }
}

export const RawAssumePermissions = Abstraction.createImplementation({
    implementation: RawAssumePermissionsImpl,
    dependencies: []
});
