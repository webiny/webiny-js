import { makeAutoObservable } from "mobx";
import { Auth } from "@aws-amplify/auth";
import type { AuthOptions } from "@aws-amplify/auth/lib-esm/types/index.js";
import { IdentityContext } from "@webiny/app-admin/features/Identity";
import { LogInUseCase } from "@webiny/app-admin/features/Identity";
import {
    CognitoPresenter as CognitoPresenterAbstraction,
    type AuthState,
    type AuthData,
    type AuthMessage,
    type ICognitoInitParams
} from "./abstractions.js";

class CognitoPresenterImpl implements CognitoPresenterAbstraction.Interface {
    vm = {
        authState: "signIn" as AuthState,
        authData: null as AuthData | null,
        message: null as AuthMessage | null,
        checkingUser: false
    };

    private initialized = false;

    constructor(
        private identityContext: IdentityContext.Interface,
        private logInUseCase: LogInUseCase.Interface
    ) {
        makeAutoObservable(this);
    }

    async init(params: ICognitoInitParams): Promise<void> {
        if (this.initialized) {
            return;
        }

        // Configure AWS Amplify Auth
        const authConfig: AuthOptions = {
            region: params.region,
            userPoolId: params.userPoolId,
            userPoolWebClientId: params.clientId
        };

        Auth.configure(authConfig);
        this.initialized = true;

        // Check URL for state changes (e.g., OAuth redirects)
        await this.checkUrl();
    }

    async changeState(
        state: AuthState,
        data: AuthData | null = null,
        message: AuthMessage | null = null
    ): Promise<void> {
        this.vm.message = message || null;

        if (state === this.vm.authState) {
            return;
        }

        // Handle signed in state
        if (state === "signedIn") {
            try {
                const session = await Auth.currentSession();
                const idToken = session.getIdToken();

                // Call LogInUseCase with idTokenProvider
                const result = await this.logInUseCase.execute({
                    idTokenProvider: async () => {
                        const currentSession = await Auth.currentSession();
                        return currentSession.getIdToken().getJwtToken();
                    },
                    logoutCallback: () => {
                        Auth.signOut();
                        this.vm.authState = "signIn";
                        this.vm.authData = null;
                    }
                });

                if (result.isFail()) {
                    console.error("Login failed:", result.error);
                    this.vm.authState = "signIn";
                    this.vm.message = {
                        title: "Login Failed",
                        text: result.error.message,
                        type: "danger"
                    };
                    return;
                }
            } catch (error) {
                console.error("Error during sign in:", error);
                this.vm.authState = "signIn";
                return;
            }
        }

        this.vm.authState = state;
        this.vm.authData = data || null;
    }

    private async checkUrl(): Promise<void> {
        const query = new URLSearchParams(window.location.search);
        const queryData: Record<string, string> = {};
        query.forEach((value, key) => (queryData[key] = value));
        const { state, ...params } = queryData;

        if (state) {
            await this.changeState(state as AuthState, params as AuthData);
            return;
        }

        return this.checkUser();
    }

    private async checkUser(): Promise<void> {
        this.vm.checkingUser = true;
        try {
            const cognitoUser = await Auth.currentSession();
            if (!cognitoUser) {
                await this.changeState("signIn");
                this.vm.checkingUser = false;
            } else {
                await this.changeState("signedIn");
                this.vm.checkingUser = false;
            }
        } catch {
            this.vm.checkingUser = false;
        }
    }
}

export const CognitoPresenter = CognitoPresenterAbstraction.createImplementation({
    implementation: CognitoPresenterImpl,
    dependencies: [IdentityContext, LogInUseCase]
});
