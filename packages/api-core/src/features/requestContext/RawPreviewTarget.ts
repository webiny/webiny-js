import { RawPreviewTarget as Abstraction } from "./abstractions.js";

/**
 * Per-request holder for the transport-extracted preview target. Registered per request, so a
 * fresh instance holds the value for the current request only.
 */
class RawPreviewTargetImpl implements Abstraction.Interface {
    private value: Abstraction.Request | null = null;

    get(): Abstraction.Request | null {
        return this.value;
    }

    set(value: Abstraction.Request | null): void {
        this.value = value;
    }
}

export const RawPreviewTarget = Abstraction.createImplementation({
    implementation: RawPreviewTargetImpl,
    dependencies: []
});
