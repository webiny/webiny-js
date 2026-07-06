import React, { useCallback, useEffect, useState } from "react";
import { Input, Button, OverlayLoader } from "@webiny/admin-ui";
import { Form, Bind } from "@webiny/form";
import { validation } from "@webiny/validation";
import { useAuthentication } from "@webiny/app-admin";
import { View, Grid } from "./components/View.js";

/*
 * Login screen for the self-hosted IdP. Visually mirrors the Cognito sign-in screen, but instead of
 * Amplify it exchanges email/password for a JWT via the `selfHostedAuthLogin` GraphQL mutation, then
 * hands the token to app-admin's auth pipeline (LogInUseCase → sets the Apollo Bearer token provider
 * and fetches the identity/permissions via the shared LogInRepository).
 */

export const SELF_HOSTED_AUTH_TOKEN_KEY = "webiny_self_hosted_auth_token";

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

export interface SelfHostedLoginScreenProps {
    graphqlUrl: string;
    children: React.ReactNode;
}

const readToken = (): string | null => {
    try {
        return window.localStorage.getItem(SELF_HOSTED_AUTH_TOKEN_KEY);
    } catch {
        return null;
    }
};

export const SelfHostedLoginScreen = (props: SelfHostedLoginScreenProps) => {
    const { graphqlUrl, children } = props;
    const { isAuthenticated, login } = useAuthentication();

    const [checkingSession, setCheckingSession] = useState(true);
    const [signingIn, setSigningIn] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Hand app-admin a provider that reads the stored JWT, plus a logout that clears it.
    const establishSession = useCallback(async () => {
        await login({
            idTokenProvider: async () => readToken() ?? undefined,
            logoutCallback: async () => {
                try {
                    window.localStorage.removeItem(SELF_HOSTED_AUTH_TOKEN_KEY);
                } catch {
                    // ignore
                }
            }
        });
    }, [login]);

    // Restore an existing session on load (if a token is present and still valid).
    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!readToken()) {
                setCheckingSession(false);
                return;
            }
            try {
                await establishSession();
            } catch {
                try {
                    window.localStorage.removeItem(SELF_HOSTED_AUTH_TOKEN_KEY);
                } catch {
                    // ignore
                }
            } finally {
                if (!cancelled) {
                    setCheckingSession(false);
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [establishSession]);

    const onSubmit = useCallback(
        async (data: { email: string; password: string }) => {
            setError(null);
            setSigningIn(true);
            try {
                const response = await fetch(graphqlUrl, {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                        query: LOGIN_MUTATION,
                        variables: { email: data.email, password: data.password }
                    })
                });

                const body = await response.json();
                const result = body?.data?.selfHostedAuthLogin;

                if (!result || result.error || !result.data?.token) {
                    setError(result?.error?.message || "Invalid email or password.");
                    return;
                }

                window.localStorage.setItem(SELF_HOSTED_AUTH_TOKEN_KEY, result.data.token);
                await establishSession();
            } catch (e) {
                setError(e instanceof Error ? e.message : "Unable to sign in. Please try again.");
            } finally {
                setSigningIn(false);
            }
        },
        [graphqlUrl, establishSession]
    );

    if (isAuthenticated) {
        return <>{children}</>;
    }

    if (checkingSession) {
        return <OverlayLoader text={"Checking session..."} />;
    }

    return (
        <View.Container>
            <Form onSubmit={onSubmit as any} submitOnEnter>
                {({ submit }) => (
                    <View.Content>
                        {signingIn ? <OverlayLoader text={"Signing in..."} /> : null}
                        <View.Title title={"Sign in"} />
                        <View.Error description={error} />

                        <Grid>
                            <Grid.Column span={12}>
                                <Bind
                                    name={"email"}
                                    validators={validation.create("required,email")}
                                    beforeChange={(val: string, cb: (value: string) => void) =>
                                        cb(val.toLowerCase())
                                    }
                                >
                                    <Input label={"Email"} />
                                </Bind>
                            </Grid.Column>
                            <Grid.Column span={12}>
                                <Bind name={"password"} validators={validation.create("required")}>
                                    <Input
                                        type={"password"}
                                        label={"Password"}
                                        autoComplete={"off"}
                                    />
                                </Bind>
                            </Grid.Column>
                            <Grid.Column span={12}>
                                <div className={"flex flex-row-reverse items-center"}>
                                    <Button
                                        text={"Submit"}
                                        data-testid={"submit-sign-in-form-button"}
                                        onClick={submit}
                                        disabled={signingIn}
                                    />
                                </div>
                            </Grid.Column>
                        </Grid>
                    </View.Content>
                )}
            </Form>
        </View.Container>
    );
};
