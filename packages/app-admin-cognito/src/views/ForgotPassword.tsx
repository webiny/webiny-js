import * as React from "react";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import { ButtonPrimary, ButtonDefault } from "@webiny/ui/Button";
import { Input } from "@webiny/ui/Input";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { Alert } from "@webiny/ui/Alert";
import { Elevation } from "@webiny/ui/Elevation";
import StateContainer from "./StateContainer";
import { alignRight, InnerContent, Title } from "./StyledComponents";
import { CircularProgress } from "@webiny/ui/Progress";
import { useAuthenticator } from "@webiny/app-cognito-authenticator/hooks/useAuthenticator";
import { useForgotPassword } from "@webiny/app-cognito-authenticator/hooks/useForgotPassword";

const ForgotPassword: React.FC = () => {
    const { authData, changeState } = useAuthenticator();
    const { loading, codeSent, shouldRender, setPassword, requestCode, error } =
        useForgotPassword();

    if (!shouldRender) {
        return null;
    }

    const { username = "" } = authData || {};

    return (
        <StateContainer>
            <Form
                data={{ username }}
                onSubmit={({ username }) =>
                    codeSent ? setPassword({ username }) : requestCode({ username })
                }
                submitOnEnter
            >
                {({ Bind, submit, data }) => (
                    <>
                        <Elevation z={2}>
                            <InnerContent>
                                {loading && <CircularProgress />}
                                <Title>
                                    <h1>
                                        <Typography use="headline4">Password Recovery</Typography>
                                    </h1>
                                    <p>
                                        <Typography use="subtitle2">
                                            request a password reset code
                                        </Typography>
                                    </p>
                                </Title>

                                {error && (
                                    <Grid>
                                        <Cell span={12}>
                                            <Alert title={"Something went wrong"} type={"danger"}>
                                                {error}
                                            </Alert>
                                        </Cell>
                                    </Grid>
                                )}

                                {!codeSent ? (
                                    <>
                                        <Grid>
                                            <Cell span={12}>
                                                <Bind
                                                    name="username"
                                                    validators={validation.create("required")}
                                                    beforeChange={(
                                                        val: string,
                                                        cb: (value: string) => void
                                                    ) => cb(val.toLowerCase())}
                                                >
                                                    <Input
                                                        label={"Email"}
                                                        description={
                                                            "A reset code will be sent to your email."
                                                        }
                                                    />
                                                </Bind>
                                            </Cell>
                                        </Grid>

                                        <Grid>
                                            <Cell span={12} className={alignRight}>
                                                <ButtonPrimary
                                                    onClick={ev => {
                                                        submit(ev);
                                                    }}
                                                    data-testid="send-code"
                                                >
                                                    {"Send me the code"}
                                                </ButtonPrimary>
                                            </Cell>
                                        </Grid>
                                    </>
                                ) : (
                                    <>
                                        <Grid>
                                            <Cell span={12}>
                                                <Typography use="body1">
                                                    We have sent you a code to reset your password!
                                                    <br />
                                                    <br />
                                                    Click the &quot;Resend code&quot; button below
                                                    to resend the code in case you haven&apos;t
                                                    received it the first time.
                                                </Typography>
                                            </Cell>
                                        </Grid>
                                        <Grid>
                                            <Cell span={12} className={alignRight}>
                                                <ButtonDefault
                                                    onClick={() => {
                                                        requestCode({ username: data.username });
                                                    }}
                                                >
                                                    {"Resend code"}
                                                </ButtonDefault>
                                                <ButtonPrimary
                                                    onClick={ev => {
                                                        submit(ev);
                                                    }}
                                                >
                                                    I got the code!
                                                </ButtonPrimary>
                                            </Cell>
                                        </Grid>
                                    </>
                                )}
                            </InnerContent>
                        </Elevation>
                        <Grid>
                            <Cell span={12} style={{ textAlign: "center" }}>
                                Want to sign in? {/* eslint-disable-next-line */}
                                <a href={"#"} onClick={() => changeState("signIn")}>
                                    Sign in
                                </a>
                            </Cell>
                        </Grid>
                    </>
                )}
            </Form>
        </StateContainer>
    );
};

export default ForgotPassword;
