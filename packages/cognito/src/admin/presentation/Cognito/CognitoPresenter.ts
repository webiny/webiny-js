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
            requestPasswordResetCode: {
                isLoading: this.formLoading,
                message: this.message
            },
            passwordResetCodeSent: {
                isLoading: this.formLoading,
                message: this.message
            },
            setNewPassword: {
                isLoading: this.formLoading,
                message: this.message
            },
            requireNewPassword: {
                isLoading: this.formLoading,
                requiredAttributes: (this.authData && this.authData.requiredAttributes) || []
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
        } catch (error) {
            // We ignore errors and pretend that everything went fine.
            // Showing an error would give a potential attacker information about which usernames exist (or not).
            // This way it's more difficult to exploit the process.
        } finally {
            runInAction(() => {
                this.authState = "passwordResetCodeSent";
                this.authData = { username };
                this.formLoading = false;
            });
        }
    }

    async resendPasswordResetCode(): Promise<void> {
        const username = this.authData?.username;
        if (this.authState !== "passwordResetCodeSent" || !username) {
            return;
        }

        await this.requestPasswordReset(username!);
        runInAction(() => {
            this.message = {
                title: "Code Resent",
                text: "Password reset code has been resent to your email address. Please check your inbox!",
                type: "success"
            };
        });
    }

    async confirmPasswordReset(code: string, password: string): Promise<void> {
        const username = this.authData?.username;
        if (!username) {
            return;
        }

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

    showRequestPasswordResetCode(): void {
        this.authState = "requestPasswordResetCode";
        this.message = null;
    }

    showSetNewPassword(): void {
        this.authState = "setNewPassword";
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
