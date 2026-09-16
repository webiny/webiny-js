import { makeAutoObservable } from "mobx";
import { LogInUseCase } from "@webiny/app-admin/features/security/LogIn/index.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/index.js";
import { SelfHostedAuthPresenter as PresenterAbstraction } from "./abstractions.js";
import type { AuthMessage } from "./abstractions.js";
import type { AuthScreen } from "./abstractions.js";
import type { SelfHostedAuthInitParams } from "./abstractions.js";

export const SELF_HOSTED_AUTH_TOKEN_KEY = "webiny_self_hosted_auth_token";

/** What every mutation in this file returns: the payload, or the error the API chose to name. */
interface MutationPayload<TData> {
    data: TData | null;
    error: { code: string; message: string } | null;
}

const LOGIN_MUTATION = /* GraphQL */ `
    mutation SelfHostedAuthLogin($email: String!, $password: String!) {
        selfHostedAuthLogin(email: $email, password: $password) {
            data {
                token
                expiresIn
            }
            error {
                code
                message
            }
        }
    }
`;

const REQUEST_RESET_MUTATION = /* GraphQL */ `
    mutation SelfHostedAuthRequestPasswordReset($email: String!) {
        selfHostedAuthRequestPasswordReset(email: $email) {
            data
            error {
                code
                message
            }
        }
    }
`;

const RESET_MUTATION = /* GraphQL */ `
    mutation SelfHostedAuthResetPassword($email: String!, $code: String!, $password: String!) {
        selfHostedAuthResetPassword(email: $email, code: $code, password: $password) {
            data
            error {
                code
                message
            }
        }
    }
`;

const readToken = (): string | null => {
    try {
        return window.localStorage.getItem(SELF_HOSTED_AUTH_TOKEN_KEY);
    } catch {
        return null;
    }
};

const writeToken = (token: string) => {
    try {
        window.localStorage.setItem(SELF_HOSTED_AUTH_TOKEN_KEY, token);
    } catch {
        // A browser refusing storage is not something the user can act on here.
    }
};

const clearToken = () => {
    try {
        window.localStorage.removeItem(SELF_HOSTED_AUTH_TOKEN_KEY);
    } catch {
        // Same.
    }
};

class SelfHostedAuthPresenterImpl implements PresenterAbstraction.Interface {
    private graphqlUrl = "";
    private passwordResetEnabled = true;
    private initialized = false;

    private screen: AuthScreen = "signIn";
    private message: AuthMessage | null = null;
    private formLoading = false;
    private signingIn = false;
    private checkingSession = true;

    /** Remembered from the request screen, so the next two screens know which address to act on. */
    private resetEmail = "";

    constructor(
        private identity: IdentityContext.Interface,
        private logInUseCase: LogInUseCase.Interface
    ) {
        makeAutoObservable(this);
    }

    get vm() {
        const identity = this.identity.getIdentity();

        return {
            screen: this.screen,
            isAuthenticated: identity.isAuthenticated,
            checkingSession: this.checkingSession,
            isSigningIn: this.signingIn,
            signIn: {
                isLoading: this.formLoading,
                message: this.screen === "signIn" ? this.message : null,
                passwordResetEnabled: this.passwordResetEnabled
            },
            requestResetCode: {
                isLoading: this.formLoading,
                message: this.screen === "requestResetCode" ? this.message : null
            },
            resetCodeSent: {
                isLoading: this.formLoading,
                message: this.screen === "resetCodeSent" ? this.message : null,
                email: this.resetEmail
            },
            setNewPassword: {
                isLoading: this.formLoading,
                message: this.screen === "setNewPassword" ? this.message : null
            }
        };
    }

    init(params: SelfHostedAuthInitParams): void {
        // The view calls this from an effect, which runs again on a hot reload. Restoring the
        // session twice would re-enter the login pipeline underneath an authenticated app.
        if (this.initialized) {
            return;
        }

        this.initialized = true;
        this.graphqlUrl = params.graphqlUrl;
        this.passwordResetEnabled = params.passwordResetEnabled;

        void this.restoreSession();
    }

    showSignIn(): void {
        this.screen = "signIn";
        this.message = null;
    }

    showRequestResetCode(): void {
        this.screen = "requestResetCode";
        this.message = null;
    }

    showSetNewPassword(): void {
        this.screen = "setNewPassword";
        this.message = null;
    }

    async signIn(email: string, password: string): Promise<void> {
        this.message = null;
        this.signingIn = true;

        try {
            const result = await this.mutate<{ token?: string }>(LOGIN_MUTATION, {
                email,
                password
            });

            if (result.error || !result.data?.token) {
                this.fail("Sign in failed", result.error?.message ?? "Invalid email or password.");
                return;
            }

            writeToken(result.data.token);
            await this.establishSession();
        } catch (err) {
            this.fail("Sign in failed", toMessage(err, "Unable to sign in. Please try again."));
        } finally {
            this.signingIn = false;
        }
    }

    async requestResetCode(email: string): Promise<void> {
        this.resetEmail = email;
        await this.sendResetRequest();

        // Only a code that actually went out moves the user on. A refusal keeps them on the form
        // they can act from, with the reason next to the field they would change.
        if (this.message?.type === "success") {
            this.screen = "resetCodeSent";
        }
    }

    async resendResetCode(): Promise<void> {
        await this.sendResetRequest();
    }

    async resetPassword(code: string, password: string): Promise<void> {
        this.message = null;
        this.formLoading = true;

        try {
            const result = await this.mutate(RESET_MUTATION, {
                email: this.resetEmail,
                code,
                password
            });

            if (result.error) {
                this.fail("Could not reset your password", result.error.message);
                return;
            }

            this.screen = "signIn";
            this.message = {
                title: "Password updated",
                text: "Your password has been changed. Sign in with your new password.",
                type: "success"
            };
        } catch (err) {
            this.fail(
                "Could not reset your password",
                toMessage(err, "Unable to reset your password. Please try again.")
            );
        } finally {
            this.formLoading = false;
        }
    }

    /**
     * Shared by the first request and the resend, so both report the same way. The success message
     * is deliberately the same whether or not the address has an account: the API answers
     * identically on purpose, and a screen that said "no such user" would give away what the API
     * refuses to.
     */
    private async sendResetRequest(): Promise<void> {
        this.message = null;
        this.formLoading = true;

        try {
            const result = await this.mutate(REQUEST_RESET_MUTATION, { email: this.resetEmail });

            // Mail that is not configured is the installation's problem rather than the user's,
            // and the message names the CLI command that still works, so it reads as guidance
            // rather than a failure.
            if (result.error?.code === "MAILER_NOT_CONFIGURED") {
                this.message = {
                    title: "Password reset is not available",
                    text: result.error.message,
                    type: "warning"
                };
                return;
            }

            if (result.error) {
                this.fail("Could not send a code", result.error.message);
                return;
            }

            this.message = {
                title: "Check your email",
                text: `If an account exists for ${this.resetEmail}, a reset code is on its way.`,
                type: "success"
            };
        } catch (err) {
            this.fail("Could not send a code", toMessage(err, "Unable to send a code right now."));
        } finally {
            this.formLoading = false;
        }
    }

    private async restoreSession(): Promise<void> {
        if (!readToken()) {
            this.checkingSession = false;
            return;
        }

        try {
            await this.establishSession();
        } catch {
            clearToken();
        } finally {
            this.checkingSession = false;
        }
    }

    /** Hands app-admin a provider that reads the stored JWT, plus a logout that clears it. */
    private async establishSession(): Promise<void> {
        await this.logInUseCase.execute({
            idTokenProvider: async () => readToken() ?? undefined,
            logoutCallback: async () => {
                clearToken();
            }
        });
    }

    private fail(title: string, text: string): void {
        this.message = { title, text, type: "danger" };
    }

    private async mutate<TData = boolean>(
        query: string,
        variables: Record<string, unknown>
    ): Promise<MutationPayload<TData>> {
        const response = await fetch(this.graphqlUrl, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ query, variables })
        });

        const body = await response.json();

        if (body?.errors?.length) {
            throw new Error(body.errors[0].message);
        }

        // One mutation per document, so whatever field came back is the one that was asked for.
        const payloads: MutationPayload<TData>[] = Object.values(body?.data ?? {});
        const payload = payloads[0];

        if (!payload) {
            throw new Error("The API returned an unexpected response.");
        }

        return payload;
    }
}

const toMessage = (err: unknown, fallback: string): string => {
    return err instanceof Error ? err.message : fallback;
};

export const SelfHostedAuthPresenter = PresenterAbstraction.createImplementation({
    implementation: SelfHostedAuthPresenterImpl,
    dependencies: [IdentityContext, LogInUseCase]
});
