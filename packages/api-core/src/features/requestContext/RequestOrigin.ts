import { RequestOrigin as Abstraction } from "./abstractions.js";
import type { IRequestOrigin } from "./abstractions.js";

/**
 * Per-request holder for the transport-extracted public origin. Registered per request, so a fresh
 * instance holds the value for the current request only.
 */
class RequestOriginImpl implements IRequestOrigin {
    private value: string | null = null;

    get(): string | null {
        return this.value;
    }

    set(origin: string | null): void {
        this.value = origin;
    }
}

export const RequestOrigin = Abstraction.createImplementation({
    implementation: RequestOriginImpl,
    dependencies: []
});
