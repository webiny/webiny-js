// @flow
import * as React from "react";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import { ButtonPrimary, ButtonDefault } from "@webiny/ui/Button";
import { Input } from "@webiny/ui/Input";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { Elevation } from "@webiny/ui/Elevation";
import StateContainer from "./StateContainer";
import { alignRight, InnerContent, Title, errorMessage } from "../StyledComponents";
import ForgotPassword from "../cognito/states/ForgotPassword";
import { CircularProgress } from "@webiny/ui/Progress";

export default (authProps: Object) => {
    return (
        <ForgotPassword {...authProps}>
            {({ requestLink, setPassword, linkSent, error, loading }) => {
                const { username = "", code = "", system = false } = authProps.authData || {};
                return (
                    <StateContainer>
                        <Form
                            data={{ username, code }}
                            onSubmit={data => (code ? setPassword(data) : requestLink(data))}
                            submitOnEnter
                        >
                            {({ Bind, submit, data }) => (
                                <>
                                    <Elevation z={2}>
                                        {code && username ? (
                                            <InnerContent>
                                                {loading && <CircularProgress />}
                                                <Title>
                                                    <h1>
                                                        <Typography use="headline4">
                                                            Set new password
                                                        </Typography>
                                                    </h1>
                                                </Title>

                                                {error && (
                                                    <Grid>
                                                        <Cell span={12} className={errorMessage}>
                                                            {error}
                                                        </Cell>
                                                    </Grid>
                                                )}

                                                <Grid>
                                                    <Cell span={12}>
                                                        <Bind
                                                            name="password"
                                                            validators={validation.create("required,password")}
                                                        >
                                                            <Input
                                                                type={"password"}
                                                                label={"New password"}
                                                                box={true}
                                                                description={
                                                                    "Enter your new password."
                                                                }
                                                            />
                                                        </Bind>
                                                    </Cell>
                                                </Grid>

                                                <Grid>
                                                    <Cell span={12} className={alignRight}>
                                                        <ButtonPrimary raised onClick={submit}>
                                                            {"Set new password"}
                                                        </ButtonPrimary>
                                                    </Cell>
                                                </Grid>
                                            </InnerContent>
                                        ) : (
                                            <InnerContent>
                                                {loading && <CircularProgress />}
                                                <Title>
                                                    <h1>
                                                        <Typography use="headline4">
                                                            {system
                                                                ? "Set a new password"
                                                                : "Password recovery"}
                                                        </Typography>
                                                    </h1>
                                                    <p>
                                                        <Typography use="subtitle2">
                                                            request a password reset link
                                                        </Typography>
                                                    </p>
                                                </Title>

                                                {error && (
                                                    <Grid>
                                                        <Cell span={12} className={errorMessage}>
                                                            {error}
                                                        </Cell>
                                                    </Grid>
                                                )}

                                                {!linkSent ? (
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
                                                                            "A reset link will be sent to your email."
                                                                        }
                                                                    />
                                                                </Bind>
                                                            </Cell>
                                                        </Grid>

                                                        <Grid>
                                                            <Cell span={12} className={alignRight}>
                                                                <ButtonPrimary
                                                                    raised
                                                                    onClick={submit}
                                                                >
                                                                    {"Reset my password"}
                                                                </ButtonPrimary>
                                                            </Cell>
                                                        </Grid>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Grid>
                                                            <Cell span={12}>
                                                                <Typography use="body1">
                                                                    We have sent you a link to reset
                                                                    your password!
                                                                    <br />
                                                                    <br />
                                                                    Click the "Resend link" button
                                                                    below to resend the link in case
                                                                    you haven't received it the
                                                                    first time.
                                                                </Typography>
                                                            </Cell>
                                                        </Grid>
                                                        <Grid>
                                                            <Cell span={12} className={alignRight}>
                                                                <ButtonDefault
                                                                    onClick={() =>
                                                                        requestLink(data)
                                                                    }
                                                                >
                                                                    {"Resend link"}
                                                                </ButtonDefault>
                                                            </Cell>
                                                        </Grid>
                                                    </>
                                                )}
                                            </InnerContent>
                                        )}
                                    </Elevation>
                                    <Grid>
                                        <Cell span={12} style={{ textAlign: "center" }}>
                                            Want to sign in? {/* eslint-disable-next-line */}
                                            <a
                                              href={"#"}
                                              onClick={() => authProps.changeState("signIn")}
                                            >
                                                Sign in
                                            </a>
                                        </Cell>
                                    </Grid>
                                </>
                            )}
                        </Form>
                    </StateContainer>
                );
            }}
        </ForgotPassword>
    );
};
