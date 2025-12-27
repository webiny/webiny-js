import { AuthenticationContext as Abstraction } from "./abstractions.js";

const defaultIdTokenProvider: Abstraction.IdTokenProvider = () => undefined;

class AuthenticationContextImpl implements Abstraction.Interface {
    private idTokenProvider: Abstraction.IdTokenProvider = defaultIdTokenProvider;
    private logoutCallback: Abstraction.LogoutCallback | undefined;

    getIdToken: Abstraction.IdTokenProvider = () => {
        return this.idTokenProvider();
    };

    setIdTokenProvider(provider: Abstraction.IdTokenProvider): void {
        this.idTokenProvider = provider;
    }

    getLogoutCallback(): Abstraction.LogoutCallback {
        return this.logoutCallback ?? (() => void 0);
    }

    setLogoutCallback(callback: Abstraction.LogoutCallback | undefined): void {
        this.logoutCallback = callback;
    }
}

export const AuthenticationContext = Abstraction.createImplementation({
    implementation: AuthenticationContextImpl,
    dependencies: []
});
