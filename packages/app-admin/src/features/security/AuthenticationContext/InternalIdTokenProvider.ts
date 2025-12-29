import { InternalIdTokenProvider as Abstraction } from "~/features/security/AuthenticationContext/abstractions.js";

const noop = () => undefined;

class InternalIdTokenProviderImpl implements Abstraction.Interface {
    private tokenProvider: Abstraction.TokenProvider = noop;

    getTokenProvider(): Abstraction.TokenProvider {
        return this.tokenProvider;
    }

    setTokenProvider(idTokenProvider: Abstraction.TokenProvider): void {
        this.tokenProvider = idTokenProvider;
    }
}

export const InternalIdTokenProvider = Abstraction.createImplementation({
    implementation: InternalIdTokenProviderImpl,
    dependencies: []
});
