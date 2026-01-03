import { makeAutoObservable, runInAction } from "mobx";
import { Auth } from "@aws-amplify/auth";
import { AuthOptions } from "@aws-amplify/auth/lib-esm/types/index.js";
import {
    CognitoPresenter as CognitoPresenterAbstraction,
    AuthState,
    AuthData,
    AuthMessage,
    ICognitoInitParams
} from "./abstractions.js";
import { LogInUseCase } from "@webiny/app-admin/features/security/LogIn/index.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/index.js";

class CognitoPresenterImpl implements CognitoPresenterAbstraction.Interface {
    private authState: AuthState = "signIn";
    private authData: AuthData | null = null;
    private message: AuthMessage | null = null;
    private checkingSession = false;
    private isLoggingIn = false;
    private formLoading = false;
    private cognitoUser: any = null;
    private initialized = false;

    constructor(
        private identity: IdentityContext.Interface,
        private logInUseCase: LogInUseCase.Interface
    ) {
        makeAutoObservable(this);
    }

    get vm() {
        const identity = this.identity.getIdentity();

        return {
            authState: this.authState,
            checkingSession: this.checkingSession,
            isLoggingIn: this.isLoggingIn,
            isAuthenticated: identity.isAuthenticated,

            // View-specific VMs
            signIn: {
                isLoading: this.formLoading,
                message: this.message
            },
            requireNewPassword: {
                isLoading: this.formLoading,
                requiredAttributes: (this.authData && this.authData.requiredAttributes) || []
            },
            forgotPassword: {
                isLoading: this.formLoading,
                message: this.message
            },
            setNewPassword: {
                isLoading: this.formLoading,
                message: this.message
            }
        };
    }

    async init(params: ICognitoInitParams): Promise<void> {
        if (this.initialized) {
            return;
        }

        const authConfig: AuthOptions = {
            region: params.region,
            userPoolId: params.userPoolId,
            userPoolWebClientId: params.clientId
        };

        Auth.configure(authConfig);
        this.initialized = true;

        await this.checkUrl();
    }

    // Public API
    async signIn(username: string, password: string): Promise<void> {
        runInAction(() => {
            this.formLoading = true;
            this.message = null;
        });

        const usernameOrPassword = ["UserNotFoundException", "NotAuthorizedException"];

        try {
            const user = await Auth.signIn(username, password);

            if (user.challengeName === "NEW_PASSWORD_REQUIRED") {
                runInAction(() => {
                    this.cognitoUser = user;
                    this.authState = "requireNewPassword";
                    this.authData = {
                        requiredAttributes: user.challengeParam.requiredAttributes || []
                    };
                    this.formLoading = false;
                });
            } else {
                await this.handleSignedIn();
                runInAction(() => {
                    this.formLoading = false;
                });
            }
        } catch (error) {
            let message = error.message;

            if (usernameOrPassword.includes(error.code)) {
                message = "Incorrect username or password.";
            }
            runInAction(() => {
                this.message = {
                    title: "Login Failed",
                    text: message,
                    type: "danger"
                };
                this.formLoading = false;
            });
        }
    }

    async confirmNewPassword(password: string, requiredAttributes: any): Promise<void> {
        runInAction(() => {
            this.formLoading = true;
            this.message = null;
        });

        try {
            await Auth.completeNewPassword(this.cognitoUser, password, requiredAttributes);
            await this.handleSignedIn();
        } catch (error) {
            runInAction(() => {
                this.message = {
                    title: "Error",
                    text: error.message,
                    type: "danger"
                };
            });
        } finally {
            runInAction(() => {
                this.formLoading = false;
            });
        }
    }

    async requestPasswordReset(username: string): Promise<void> {
        runInAction(() => {
            this.formLoading = true;
            this.message = null;
        });

        try {
            await Auth.forgotPassword(username);
            runInAction(() => {
                this.authState = "setNewPassword";
                this.authData = { username };
                this.message = {
                    title: "Code Sent",
                    text: "Check your email for the reset code",
                    type: "success"
                };
            });
        } catch (error) {
            runInAction(() => {
                this.message = {
                    title: "Error",
                    text: error.message,
                    type: "danger"
                };
            });
        } finally {
            runInAction(() => {
                this.formLoading = false;
            });
        }
    }

    async confirmPasswordReset(username: string, code: string, password: string): Promise<void> {
        runInAction(() => {
            this.formLoading = true;
            this.message = null;
        });

        try {
            await Auth.forgotPasswordSubmit(username, code, password);
            runInAction(() => {
                this.authState = "signIn";
                this.message = {
                    title: "Password Reset",
                    text: "You can now sign in with your new password",
                    type: "success"
                };
            });
        } catch (error) {
            runInAction(() => {
                this.message = {
                    title: "Error",
                    text: error.message,
                    type: "danger"
                };
            });
        } finally {
            runInAction(() => {
                this.formLoading = false;
            });
        }
    }

    showSignIn(): void {
        this.authState = "signIn";
        this.authData = null;
        this.message = null;
    }

    showForgotPassword(): void {
        this.authState = "forgotPassword";
        this.message = null;
    }

    // Private/internal methods
    private async handleSignedIn(): Promise<void> {
        runInAction(() => {
            this.isLoggingIn = true;
        });

        try {
            await this.logInUseCase.execute({
                idTokenProvider: async () => {
                    const currentSession = await Auth.currentSession();
                    return currentSession.getIdToken().getJwtToken();
                },
                logoutCallback: () => {
                    Auth.signOut();
                    runInAction(() => {
                        this.authState = "signIn";
                        this.authData = null;
                    });
                }
            });

            runInAction(() => {
                this.authState = "signedIn";
            });
        } catch (error) {
            console.error("Error during sign in:", error);
            runInAction(() => {
                this.authState = "signIn";
            });
        } finally {
            runInAction(() => {
                this.isLoggingIn = false;
            });
        }
    }

    private async checkUrl(): Promise<void> {
        const query = new URLSearchParams(window.location.search);
        const queryData: Record<string, string> = {};
        query.forEach((value, key) => (queryData[key] = value));
        const { state } = queryData;

        if (state) {
            // Handle state from URL if needed
            return;
        }

        return this.checkSession();
    }

    private async checkSession(): Promise<void> {
        runInAction(() => {
            this.checkingSession = true;
        });

        try {
            const cognitoUser = await Auth.currentSession();
            if (cognitoUser) {
                this.handleSignedIn();
            }
        } catch {
            // Not authenticated, stay on signIn
        } finally {
            runInAction(() => {
                this.checkingSession = false;
            });
        }
    }
}

export const CognitoPresenter = CognitoPresenterAbstraction.createImplementation({
    implementation: CognitoPresenterImpl,
    dependencies: [IdentityContext, LogInUseCase]
});
