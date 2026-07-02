import { RawAuthToken as Abstraction } from "./abstractions.js";
import type { IRawAuthToken } from "./abstractions.js";

/**
 * Per-request holder for the transport-extracted raw auth token. Registered per request, so a fresh
 * instance holds the value for the current request only.
 */
class RawAuthTokenImpl implements IRawAuthToken {
    private value: string | null = null;

    get(): string | null {
        return this.value;
    }

    set(token: string | null): void {
        this.value = token;
    }
}

export const RawAuthToken = Abstraction.createImplementation({
    implementation: RawAuthTokenImpl,
    dependencies: []
});
