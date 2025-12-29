import { AuthenticationContext as Abstraction, InternalIdTokenProvider } from "./abstractions.js";

const noop = () => undefined;

class AuthenticationContextImpl implements Abstraction.Interface {
    private logoutCallback: Abstraction.LogoutCallback = noop;

    constructor(private idTokenProvider: InternalIdTokenProvider.Interface) {}

    async clear(): Promise<void> {
        await this.logoutCallback();
        this.idTokenProvider.setTokenProvider(noop);
        this.logoutCallback = noop;
    }

    getIdToken: Abstraction.IdTokenProvider = () => {
        return this.idTokenProvider.getTokenProvider()();
    };

    getLogoutCallback(): Abstraction.LogoutCallback {
        return this.logoutCallback;
    }

    setIdTokenProvider(provider: Abstraction.IdTokenProvider): void {
        this.idTokenProvider.setTokenProvider(provider);
    }

    setLogoutCallback(callback: Abstraction.LogoutCallback): void {
        this.logoutCallback = callback;
    }
}

export const AuthenticationContext = Abstraction.createImplementation({
    implementation: AuthenticationContextImpl,
    dependencies: [InternalIdTokenProvider]
});
