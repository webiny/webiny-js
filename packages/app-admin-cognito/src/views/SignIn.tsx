import React from "react";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Input } from "@webiny/ui/Input";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { Elevation } from "@webiny/ui/Elevation";
import { Alert } from "@webiny/ui/Alert";
import { CircularProgress } from "@webiny/ui/Progress";
import { useAuthenticator } from "@webiny/app-cognito-authenticator/hooks/useAuthenticator";
import {
    useSignIn,
    UseSignInCallableParams
} from "@webiny/app-cognito-authenticator/hooks/useSignIn";
import StateContainer from "./StateContainer";
import { alignRight, alignCenter, InnerContent, Title, errorMessage } from "./StyledComponents";
import { CognitoFederatedProvider } from "~/index";
import { FederatedLogin } from "./FederatedLogin";

interface SignInProps {
    federatedProviders?: CognitoFederatedProvider[];
}

const SignIn = (props: SignInProps) => {
    const { message, changeState } = useAuthenticator();
    const { signIn, loading, error, shouldRender } = useSignIn();
    const { federatedProviders = [] } = props;

    if (!shouldRender) {
        return null;
    }

    return (
        <StateContainer>
            <Form
                onSubmit={data => {
                    /**
                     * We are positive that data is UseSignInCallableParams
                     */
                    return signIn(data as unknown as UseSignInCallableParams);
                }}
                submitOnEnter
            >
                {({ Bind, submit }) => (
                    <Elevation z={2}>
                        <InnerContent>
                            {loading && <CircularProgress label={"Signing in..."} />}
                            <Title>
                                <h1>
                                    <Typography use="headline4">Sign In</Typography>
                                </h1>
                            </Title>

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
                                    <Bind
                                        name="password"
                                        validators={validation.create("required")}
                                    >
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
                            {federatedProviders.length ? (
                                <FederatedLogin providers={federatedProviders} />
                            ) : null}
                        </InnerContent>
                    </Elevation>
                )}
            </Form>
        </StateContainer>
    );
};

export default SignIn;
