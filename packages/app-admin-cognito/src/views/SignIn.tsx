import React from "react";
import { makeDecoratable } from "@webiny/app-admin";
import { Form, Bind, useForm } from "@webiny/form";
import { validation } from "@webiny/validation";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Input } from "@webiny/ui/Input";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Alert } from "@webiny/ui/Alert";
import { CircularProgress } from "@webiny/ui/Progress";
import { useAuthenticator } from "@webiny/app-cognito-authenticator/hooks/useAuthenticator";
import {
    useSignIn,
    UseSignInCallableParams
} from "@webiny/app-cognito-authenticator/hooks/useSignIn";
import { View } from "~/components/View";
import { FederatedLogin } from "./FederatedLogin";
import { Divider } from "~/components/Divider";
import { alignRight, alignCenter, errorMessage } from "~/components/StyledComponents";
import { FederatedIdentityProvider } from "~/federatedIdentityProviders";

export interface SignInProps {
    title?: string;
    description?: React.ReactNode;
    /**
     * This prop lets you override the entire content of the view.
     * You'll need to implement your own title, description, and content rendering.
     */
    content?: React.ReactNode;
    footer?: React.ReactNode;
    allowSignInWithCredentials?: boolean;
    federatedProviders?: FederatedIdentityProvider[];
}

export interface SignInDefaultContentProps extends SignInProps {
    error?: Error | null;
}


const DefaultContent = (props: SignInDefaultContentProps) => {
    const { submit } = useForm();
    const { message, changeState } = useAuthenticator();
    const {
        title = "Sign In",
        description = undefined,
        federatedProviders = [],
        allowSignInWithCredentials = true,
        error = null
    } = props;

    return (
        <>
            <View.Title title={title} description={description} />
            {message && !error && (
                <Grid>
                    <Cell span={12}>
                        <Alert title={message.title} type={message.type}>
                            {message.text}
                        </Alert>
                    </Cell>
                </Grid>
            )}

            {error && (
                <Grid>
                    <Cell span={12} className={errorMessage}>
                        <Alert title="Authentication error" type={"danger"}>
                            {error.message}
                        </Alert>
                    </Cell>
                </Grid>
            )}

            {allowSignInWithCredentials ? (
                <Grid>
                    <Cell span={12}>
                        <Bind
                            name="username"
                            validators={validation.create("required,email")}
                            beforeChange={(val: string, cb: (value: string) => void) =>
                                cb(val.toLowerCase())
                            }
                        >
                            <Input label={"Your e-mail"} />
                        </Bind>
                    </Cell>
                    <Cell span={12}>
                        <Bind name="password" validators={validation.create("required")}>
                            <Input type={"password"} label={"Your password"} />
                        </Bind>
                    </Cell>
                    <Cell span={12} className={alignRight}>
                        <ButtonPrimary
                            data-testid="submit-sign-in-form-button"
                            onClick={ev => {
                                submit(ev);
                            }}
                        >
                            {"Submit"}
                        </ButtonPrimary>
                    </Cell>
                    <Cell span={12} className={alignCenter}>
                        <a href="#" onClick={() => changeState("forgotPassword")}>
                            Forgot password?
                        </a>
                    </Cell>
                </Grid>
            ) : null}
            {federatedProviders.length ? (
                <>
                    {allowSignInWithCredentials ? <Divider /> : null}
                    <FederatedLogin providers={federatedProviders} />
                </>
            ) : null}
        </>
    );
};

export const SignIn = makeDecoratable("SignIn", (props: SignInProps) => {
    const { signIn, loading, shouldRender, error } = useSignIn();
    const { content = undefined, footer = undefined } = props;

    if (!shouldRender) {
        return null;
    }

    return (
        <View.Container>
            <Form<UseSignInCallableParams> onSubmit={data => signIn(data)} submitOnEnter>
                {() => (
                    <>
                        <View.Content>
                            {loading && <CircularProgress label={"Signing in..."} />}
                            {content ? content : <DefaultContent {...props} error={error} />}
                        </View.Content>
                        {footer ? <View.Footer>{footer}</View.Footer> : null}
                    </>
                )}
            </Form>
        </View.Container>
    );
});
