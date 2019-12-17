// @flow
import * as React from "react";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import { ButtonPrimary, ButtonDefault } from "@webiny/ui/src/Button";
import { Input } from "@webiny/ui/src/Input";
import { Grid, Cell } from "@webiny/ui/src/Grid";
import { Typography } from "@webiny/ui/src/Typography";
import { Alert } from "@webiny/ui/src/Alert";
import { Elevation } from "@webiny/ui/src/Elevation";
import StateContainer from "./StateContainer";
import { alignRight, InnerContent, Title } from "./StyledComponents";
import { CircularProgress } from "@webiny/ui/src/Progress";

const ForgotPassword = ({
    requestCode,
    setPassword,
    codeSent,
    error,
    loading,
    authProps
}: Object) => {
    const { username = "" } = authProps.authData || {};
    return (
        <StateContainer>
            <Form
                data={{ username }}
                onSubmit={data => (codeSent ? setPassword(data) : requestCode(data))}
                submitOnEnter
            >
                {({ Bind, submit, data }) => (
                    <>
                        <Elevation z={2}>
                            <InnerContent>
                                {loading && <CircularProgress />}
                                <Title>
                                    <h1>
                                        <Typography use="headline4">Password recovery</Typography>
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
                                                    beforeChange={(val, cb) =>
                                                        cb(val.toLowerCase())
                                                    }
                                                >
                                                    <Input
                                                        label={"Email"}
                                                        box={true}
                                                        description={
                                                            "A reset code will be sent to your email."
                                                        }
                                                    />
                                                </Bind>
                                            </Cell>
                                        </Grid>

                                        <Grid>
                                            <Cell span={12} className={alignRight}>
                                                <ButtonPrimary raised onClick={submit}>
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
                                                    Click the "Resend code" button below to resend
                                                    the code in case you haven't received it the
                                                    first time.
                                                </Typography>
                                            </Cell>
                                        </Grid>
                                        <Grid>
                                            <Cell span={12} className={alignRight}>
                                                <ButtonDefault onClick={() => requestCode(data)}>
                                                    {"Resend code"}
                                                </ButtonDefault>
                                                <ButtonPrimary onClick={submit}>
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
                                <a href={"#"} onClick={() => authProps.changeState("signIn")}>
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
