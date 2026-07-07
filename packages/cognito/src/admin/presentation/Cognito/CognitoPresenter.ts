import { makeAutoObservable, runInAction } from "mobx";
import { Amplify } from "aws-amplify";
import {
    signIn,
    signOut,
    confirmSignIn,
    resetPassword,
    confirmResetPassword,
    fetchAuthSession
} from "aws-amplify/auth";
import {
    CognitoPresenter as CognitoPresenterAbstraction,
    AuthState,
    AuthData,
    AuthMessage,
    ICognitoInitParams
} from "./abstractions.js";
import { LogInUseCase } from "@webiny/app-admin/features/security/LogIn/index.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/index.js";
import { CognitoSignInConfig, type FederatedProvider } from "./CognitoSignInConfig.js";

const federatedDescription =
    "You will be taken to an external service to complete the sign-in process.";

class CognitoPresenterImpl implements CognitoPresenterAbstraction.Interface {
    private authState: AuthState = "signIn";
    private authData: AuthData | null = null;
    private message: AuthMessage | null = null;
    private checkingSession = false;
    private isLoggingIn = false;
    private formLoading = false;
    private initialized = false;

    private signInTitle = "Sign in";
    private signInDescription: string | undefined = undefined;
    private allowCredentialsLogin = true;
    private federatedProviders: FederatedProvider[] = [];

    private totpSharedSecret = "";
    private totpQrCodeUri = "";

    constructor(
        private identity: IdentityContext.Interface,
        private logInUseCase: LogInUseCase.Interface,
        private signInConfig: CognitoSignInConfig.Interface | undefined
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
                message: this.message,
                title: this.signInTitle,
                description: this.signInDescription,
                allowCredentialsLogin: this.allowCredentialsLogin,
                federatedProviders: this.federatedProviders
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
            },
            confirmTotpCode: {
                isLoading: this.formLoading,
                message: this.message
            },
            setupTotp: {
                isLoading: this.formLoading,
                sharedSecret: this.totpSharedSecret,
                qrCodeUri: this.totpQrCodeUri,
                message: this.message
            }
        };
    }

    async init(params: ICognitoInitParams): Promise<void> {
        if (this.initialized) {
            return;
        }

        let oauthConfig:
            | { Cognito: { userPoolId: string; userPoolClientId: string; loginWith: any } }
            | undefined;

        if (this.signInConfig) {
            const config = await this.signInConfig.getConfig();

            runInAction(() => {
                this.signInTitle = config.title ?? "Sign in";
                this.signInDescription = config.description;

                if (!config.description && !config.allowCredentialsLogin) {
                    this.signInDescription = federatedDescription;
                }

                this.allowCredentialsLogin = config.allowCredentialsLogin;
                this.federatedProviders = config.providers;
            });

            const domain = process.env.REACT_APP_USER_POOL_DOMAIN;
            if (domain) {
                oauthConfig = {
                    Cognito: {
                        userPoolId: params.userPoolId,
                        userPoolClientId: params.clientId,
                        loginWith: {
                            oauth: {
                                domain,
                                redirectSignIn: config.oauth.redirectSignIn,
                                redirectSignOut: config.oauth.redirectSignOut,
                                scopes: config.oauth.scopes,
                                responseType: config.oauth.responseType
                            }
                        }
                    }
                };
            }
        }

        Amplify.configure({
            Auth: oauthConfig ?? {
                Cognito: {
                    userPoolId: params.userPoolId,
                    userPoolClientId: params.clientId
                }
            }
        });
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
            const result = await signIn({ username, password });
            const { nextStep } = result;

            if (nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
                runInAction(() => {
                    this.authState = "requireNewPassword";
                    this.authData = {
                        requiredAttributes: nextStep.missingAttributes || []
                    };
                    this.formLoading = false;
                });
            } else if (nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_TOTP_CODE") {
                runInAction(() => {
                    this.authState = "confirmTotpCode";
                    this.formLoading = false;
                });
            } else if (nextStep.signInStep === "CONTINUE_SIGN_IN_WITH_TOTP_SETUP") {
                const totpSetup = nextStep.totpSetupDetails;
                const uri = totpSetup.getSetupUri("Webiny").toString();
                runInAction(() => {
                    this.totpSharedSecret = totpSetup.sharedSecret;
                    this.totpQrCodeUri = uri;
                    this.authState = "setupTotp";
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

            if (usernameOrPassword.includes(error.name)) {
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
            await confirmSignIn({
                challengeResponse: password,
                options: { userAttributes: requiredAttributes }
            });
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
            await resetPassword({ username });
        } catch {
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
            await confirmResetPassword({
                username,
                confirmationCode: code,
                newPassword: password
            });
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

    async confirmTotpCode(code: string): Promise<void> {
        runInAction(() => {
            this.formLoading = true;
            this.message = null;
        });

        try {
            await confirmSignIn({ challengeResponse: code });
            await this.handleSignedIn();
        } catch (error) {
            runInAction(() => {
                this.message = {
                    title: "Verification Failed",
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

    async verifyTotpSetup(code: string): Promise<void> {
        runInAction(() => {
            this.formLoading = true;
            this.message = null;
        });

        try {
            await confirmSignIn({ challengeResponse: code });
            await this.handleSignedIn();
        } catch (error) {
            runInAction(() => {
                this.message = {
                    title: "Setup Failed",
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
                    const session = await fetchAuthSession();
                    const idToken = session.tokens?.idToken;
                    if (!idToken) {
                        throw new Error("No ID token available.");
                    }
                    return idToken.toString();
                },
                logoutCallback: () => {
                    signOut();
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
        return this.checkSession();
    }

    private async checkSession(): Promise<void> {
        runInAction(() => {
            this.checkingSession = true;
        });

        try {
            const session = await fetchAuthSession();
            if (session.tokens) {
                // We don't need to `await`, we simply start a separate "branch" of execution.
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
    dependencies: [IdentityContext, LogInUseCase, [CognitoSignInConfig, { optional: true }]]
});
