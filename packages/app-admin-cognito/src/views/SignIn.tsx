import React from "react";
import { Grid, Input, Alert, Link, OverlayLoader, Button, Text } from "@webiny/admin-ui";
import { makeDecoratable } from "@webiny/app-admin";
import { Form, Bind, useForm } from "@webiny/form";
import { validation } from "@webiny/validation";
import { useAuthenticator } from "@webiny/app-cognito-authenticator/hooks/useAuthenticator.js";
import type { UseSignInCallableParams } from "@webiny/app-cognito-authenticator/hooks/useSignIn.js";
import { useSignIn } from "@webiny/app-cognito-authenticator/hooks/useSignIn.js";
import { View } from "~/components/View.js";
import { FederatedLogin } from "./FederatedLogin.js";
import type { FederatedIdentityProvider } from "~/federatedIdentityProviders.js";
import { Divider } from "~/components/Divider.js";

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
        title = "Login",
        description,
        federatedProviders = [],
        allowSignInWithCredentials = true,
        error = null
    } = props;

    return (
        <>
            <View.Title title={title} description={description} />
            {message && !error && (
                <div className={"mb-lg"}>
                    <Alert title={message.title} type={message.type}>
                        {message.text}
                    </Alert>
                </div>
            )}

            <View.Error title="Authentication error" description={error?.message} />

            {allowSignInWithCredentials ? (
                <Grid>
                    <Grid.Column span={12}>
                        <Bind
                            name="username"
                            validators={validation.create("required,email")}
                            beforeChange={(val: string, cb: (value: string) => void) =>
                                cb(val.toLowerCase())
                            }
                        >
                            <Input label={"Email"} size={"lg"} />
                        </Bind>
                    </Grid.Column>
                    <Grid.Column span={12}>
                        <Bind name="password" validators={validation.create("required")}>
                            <Input
                                type={"password"}
                                label={"Password"}
                                size={"lg"}
                                autoComplete={"off"}
                            />
                        </Bind>
                    </Grid.Column>
                    <Grid.Column span={12}>
                        <div
                            className={
                                "flex flex-row-reverse items-center justify-between"
                            }
                        >
                            <Button
                                text={"Submit"}
                                data-testid="submit-sign-in-form-button"
                                onClick={ev => {
                                    submit(ev);
                                }}
                                size="lg"
                            />
                            <Text as={"div"} size={"sm"}>
                                <Link to="#" onClick={() => changeState("forgotPassword")}>
                                    Forgot password?
                                </Link>
                            </Text>
                        </div>
                    </Grid.Column>
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
                            {loading && <OverlayLoader text={"Signing in..."} />}
                            {content ? content : <DefaultContent {...props} error={error} />}
                        </View.Content>
                        {footer ? <View.Footer>{footer}</View.Footer> : null}
                    </>
                )}
            </Form>
        </View.Container>
    );
});
