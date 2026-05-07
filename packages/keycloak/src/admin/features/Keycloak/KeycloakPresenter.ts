import { makeAutoObservable, runInAction } from "mobx";
import Keycloak from "keycloak-js";
import { KeycloakPresenter as Abstraction } from "./abstractions.js";
import { LogInUseCase } from "@webiny/app-admin/features/security/LogIn";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/index.js";
import { IdTokenProvider } from "./IdTokenProvider.js";

/**
 * Translates the issuer URL (which is a realm URL like
 * `http://host:port/realms/<realm>`) into the `url` + `realm` pair that
 * keycloak-js takes separately.
 */
const splitRealmUrl = (issuer: string): { url: string; realm: string } => {
    const match = issuer.match(/^(.*)\/realms\/([^/]+)\/?$/);
    if (!match) {
        throw new Error(
            `Could not parse Keycloak issuer URL "${issuer}" — expected format ` +
                "`<keycloak-base>/realms/<realm-name>`."
        );
    }
    return { url: match[1]!, realm: match[2]! };
};

class KeycloakPresenterImpl implements Abstraction.Interface {
    private keycloak: Keycloak | undefined;
    private idTokenProvider: IdTokenProvider | undefined;
    private loggingIn = false;
    private checkingSession = false;

    constructor(
        private identity: IdentityContext.Interface,
        private loginUseCase: LogInUseCase.Interface
    ) {
        makeAutoObservable(this);
    }

    get vm() {
        const identity = this.identity.getIdentity();

        return {
            isAuthenticated: identity.isAuthenticated,
            isLoggingIn: this.loggingIn,
            checkingSession: this.checkingSession
        };
    }

    async init(params: Abstraction.InitParams): Promise<void> {
        const { url, realm } = splitRealmUrl(params.issuer);

        this.keycloak = new Keycloak({
            url,
            realm,
            clientId: params.clientId
        });

        this.idTokenProvider = new IdTokenProvider(this.keycloak);

        runInAction(() => {
            this.checkingSession = true;
        });

        // `check-sso` plus `pkceMethod: 'S256'` is the standard SPA pattern:
        // silently checks for an existing session in Keycloak; returns false
        // if no session exists (we then prompt the user to log in).
        const isAuthenticated = await this.keycloak.init({
            onLoad: "check-sso",
            pkceMethod: "S256",
            checkLoginIframe: false
        });

        runInAction(() => {
            this.checkingSession = false;
        });

        if (isAuthenticated) {
            await this.login();
            return;
        }

        // Auto-login redirects to the Keycloak login page when no session is
        // present and the caller asked for it. Mirrors auth0's flow.
        if (params.autoLogin) {
            this.authenticate();
        }
    }

    authenticate() {
        this.getKeycloak().login({
            redirectUri: window.location.origin + window.location.pathname + window.location.search
        });
    }

    private async login(): Promise<void> {
        runInAction(() => {
            this.loggingIn = true;
        });

        const logoutCallback = async (): Promise<void> => {
            // keycloak.logout() always redirects; setting the redirect to
            // ourselves with `?action=logout` lets the auto-login code path
            // skip the redirect-back-to-login on the next render.
            const url = new URL(`${window.location}`);
            url.searchParams.set("action", "logout");
            await this.getKeycloak().logout({ redirectUri: url.toString() });
        };

        await this.loginUseCase.execute({
            idTokenProvider: () => this.getIdTokenProvider().getIdToken(),
            logoutCallback
        });

        runInAction(() => {
            this.loggingIn = false;
        });
    }

    private getKeycloak() {
        if (!this.keycloak) {
            throw new Error("Keycloak client is not initialized.");
        }
        return this.keycloak;
    }

    private getIdTokenProvider() {
        if (!this.idTokenProvider) {
            throw new Error("IdTokenProvider is not initialized.");
        }
        return this.idTokenProvider;
    }
}

export const KeycloakPresenter = Abstraction.createImplementation({
    implementation: KeycloakPresenterImpl,
    dependencies: [IdentityContext, LogInUseCase]
});
