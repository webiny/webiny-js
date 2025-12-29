import type { Identity } from "~/domain/Identity.js";
import { AuthenticationContext as Abstraction, InternalIdTokenProvider } from "./abstractions.js";
import { AuthenticationRepository } from "./abstractions.js";

const noop = () => undefined;

class AuthenticationContextImpl implements Abstraction.Interface {
    private logoutCallback: Abstraction.LogoutCallback = noop;

    constructor(
        private idTokenProvider: InternalIdTokenProvider.Interface,
        private repository: AuthenticationRepository.Interface
    ) {}

    async login(identityType: string): Promise<Identity> {
        return await this.repository.login(identityType);
    }

    async logout(): Promise<void> {
        await this.logoutCallback();
        this.idTokenProvider.setTokenProvider(noop);
        this.logoutCallback = noop;
    }

    getIdToken: Abstraction.IdTokenProvider = () => {
        return this.idTokenProvider.getTokenProvider()();
    };

    setIdTokenProvider(provider: Abstraction.IdTokenProvider): void {
        this.idTokenProvider.setTokenProvider(provider);
    }

    setLogoutCallback(callback: Abstraction.LogoutCallback): void {
        this.logoutCallback = callback;
    }
}

export const AuthenticationContext = Abstraction.createImplementation({
    implementation: AuthenticationContextImpl,
    dependencies: [InternalIdTokenProvider, AuthenticationRepository]
});
