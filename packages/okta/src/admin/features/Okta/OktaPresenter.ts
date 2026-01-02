import { makeAutoObservable } from "mobx";
import { runInAction } from "mobx";
import { OktaAuth } from "@okta/okta-auth-js";
import type { AuthState } from "@okta/okta-auth-js";
import { OktaPresenter as Abstraction } from "./abstractions.js";
import { LogInUseCase } from "@webiny/app-admin/features/security/LogIn";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/index.js";

class OktaPresenterImpl implements Abstraction.Interface {
    private oktaAuth: OktaAuth | undefined;
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
        this.oktaAuth = new OktaAuth({
            issuer: params.issuer,
            clientId: params.clientId,
            redirectUri: window.location.origin,
            scopes: ["openid", "profile", "email", "offline_access"],
            pkce: true,
            tokenManager: {
                storage: "localStorage"
            }
        });

        // Subscribe to authState changes
        this.oktaAuth.authStateManager.subscribe((authState: AuthState) => {
            // Handle authentication state changes
            if (authState.isAuthenticated && !this.identity.getIdentity().isAuthenticated) {
                // User just became authenticated, trigger login
                this.login();
            }
        });

        // Run as a service - this will trigger authStateManager updates
        await this.oktaAuth.start();

        // Handle redirect callback if present
        if (this.oktaAuth.token.isLoginRedirect()) {
            runInAction(() => {
                this.checkingSession = true;
            });

            try {
                const { tokens } = await this.oktaAuth.token.parseFromUrl();
                this.oktaAuth.tokenManager.setTokens(tokens);
                // Clean up URL
                window.history.replaceState({}, document.title, window.location.pathname);
            } finally {
                runInAction(() => {
                    this.checkingSession = false;
                });
            }

            return;
        }

        // // Check current auth state
        // const currentAuthState = this.oktaAuth.authStateManager.getAuthState();
        // if (currentAuthState?.isAuthenticated) {
        //     await this.login();
        //     return; // Don't check autoLogin if we're already authenticated
        // }

        // Only auto-login if not authenticated and autoLogin is enabled
        // if (params.autoLogin) {
        //     this.authenticate();
        // }
    }

    authenticate() {
        this.getOktaAuth().signInWithRedirect({
            originalUri: window.location.pathname + window.location.search
        });
    }

    private async login(): Promise<void> {
        // Prevent duplicate login attempts
        if (this.loggingIn) {
            return;
        }

        runInAction(() => {
            this.loggingIn = true;
        });

        try {
            // Set logout callback
            const logoutCallback = async (): Promise<void> => {
                // Clear tokens from local storage
                this.getOktaAuth().tokenManager.clear();

                const url = new URL(`${window.location}`);
                url.searchParams.set("action", "logout");
                window.history.replaceState({}, "", url);
            };

            await this.loginUseCase.execute({
                idTokenProvider: () => this.getOktaAuth().getIdToken(),
                logoutCallback
            });
        } finally {
            runInAction(() => {
                this.loggingIn = false;
            });
        }
    }

    private getOktaAuth() {
        if (!this.oktaAuth) {
            throw new Error("OktaAuth is not initialized.");
        }
        return this.oktaAuth;
    }
}

export const OktaPresenter = Abstraction.createImplementation({
    implementation: OktaPresenterImpl,
    dependencies: [IdentityContext, LogInUseCase]
});
