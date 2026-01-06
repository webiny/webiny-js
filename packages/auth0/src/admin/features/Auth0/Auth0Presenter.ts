import { makeAutoObservable, runInAction } from "mobx";
import { Auth0Client } from "@auth0/auth0-spa-js";
import { Auth0Presenter as Abstraction } from "./abstractions.js";
import { LogInUseCase } from "@webiny/app-admin/features/security/LogIn";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/index.js";
import { IdTokenProvider } from "./IdTokenProvider.js";

class Auth0PresenterImpl implements Abstraction.Interface {
    private auth0Client: Auth0Client | undefined;
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
        this.auth0Client = new Auth0Client({
            domain: params.issuer,
            clientId: params.clientId,
            useRefreshTokens: true,
            cacheLocation: "localstorage",
            authorizationParams: {
                redirect_uri: window.location.origin,
                scope: "openid profile email offline_access"
            }
        });

        // Initialize IdTokenProvider
        this.idTokenProvider = new IdTokenProvider(this.auth0Client);

        // Handle redirect callback if present
        const hasRedirectCallback =
            window.location.search.includes("code=") && window.location.search.includes("state=");

        if (hasRedirectCallback) {
            await this.auth0Client.handleRedirectCallback();
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Check if already authenticated
        const isAuthenticated = await this.checkSession();

        if (isAuthenticated) {
            await this.login();
            return; // Don't check autoLogin if we're already authenticated
        }

        // Only auto-login if not authenticated and autoLogin is enabled
        if (params.autoLogin && !hasRedirectCallback) {
            this.authenticate();
        }
    }

    authenticate() {
        this.getAuth0().loginWithRedirect({
            appState: { returnTo: window.location.pathname + window.location.search }
        });
    }

    private async login(): Promise<void> {
        runInAction(() => {
            this.loggingIn = true;
        });

        // Set logout callback
        const logoutCallback = async (): Promise<void> => {
            this.getAuth0().logout({ openUrl: false });

            const url = new URL(`${window.location}`);
            url.searchParams.set("action", "logout");
            window.history.replaceState({}, "", url);
        };

        await this.loginUseCase.execute({
            idTokenProvider: () => this.getIdTokenProvider().getIdToken(),
            logoutCallback
        });

        runInAction(() => {
            this.loggingIn = false;
        });
    }

    private async checkSession(): Promise<boolean> {
        runInAction(() => {
            this.checkingSession = true;
        });

        // First check if tokens exist in cache (don't try to refresh)
        const cachedToken = await this.getAuth0().getTokenSilently({ cacheMode: "cache-only" });

        runInAction(() => {
            this.checkingSession = false;
        });

        // No token in cache
        if (!cachedToken) {
            return false;
        }

        return true;
    }

    private getAuth0() {
        if (!this.auth0Client) {
            throw new Error("Auth0Client is not initialized.");
        }
        return this.auth0Client;
    }

    private getIdTokenProvider() {
        if (!this.idTokenProvider) {
            throw new Error("IdTokenProvider is not initialized.");
        }
        return this.idTokenProvider;
    }
}

export const Auth0Presenter = Abstraction.createImplementation({
    implementation: Auth0PresenterImpl,
    dependencies: [IdentityContext, LogInUseCase]
});
