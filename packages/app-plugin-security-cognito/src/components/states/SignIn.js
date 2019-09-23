// @flow
import * as React from "react";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Input } from "@webiny/ui/Input";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { Elevation } from "@webiny/ui/Elevation";
import { Alert } from "@webiny/ui/Alert";
import { CircularProgress } from "@webiny/ui/Progress";
import StateContainer from "./StateContainer";
import { alignRight, alignCenter, InnerContent, Title, errorMessage } from "../StyledComponents";
import SignIn from "../cognito/states/SignIn";

export default (authProps: Object) => {
    return (
        <SignIn {...authProps}>
            {({ signIn, error, loading }) => (
                <StateContainer>
                    <Form onSubmit={signIn} submitOnEnter>
                        {({ Bind, submit }) => (
                            <Elevation z={2}>
                                <InnerContent>
                                    {loading && <CircularProgress />}
                                    <Title>
                                        <h1>
                                            <Typography use="headline4">Sign In</Typography>
                                        </h1>
                                    </Title>

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
                                                beforeChange={(val, cb) => cb(val.toLowerCase())}
                                            >
                                                <Input label={"Your e-mail"} box={true} />
                                            </Bind>
                                        </Cell>
                                        <Cell span={12}>
                                            <Bind
                                                name="password"
                                                validators={validation.create("required,password")}
                                            >
                                                <Input
                                                    type={"password"}
                                                    label={"Your password"}
                                                    box={true}
                                                />
                                            </Bind>
                                        </Cell>
                                        <Cell span={12} className={alignRight}>
                                            <ButtonPrimary raised onClick={submit}>
                                                {"Submit"}
                                            </ButtonPrimary>
                                        </Cell>
                                        <Cell span={12} className={alignCenter}>
                                            <a
                                                href="#"
                                                onClick={() =>
                                                    authProps.changeState("forgotPassword")
                                                }
                                            >
                                                Forgot password?
                                            </a>
                                        </Cell>
                                    </Grid>
                                </InnerContent>
                            </Elevation>
                        )}
                    </Form>
                </StateContainer>
            )}
        </SignIn>
    );
};
