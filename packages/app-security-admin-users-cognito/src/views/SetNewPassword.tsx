import React from "react";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Input } from "@webiny/ui/Input";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { Elevation } from "@webiny/ui/Elevation";
import { CircularProgress } from "@webiny/ui/Progress";
import StateContainer from "./StateContainer";
import { alignRight, InnerContent, Title, errorMessage } from "./StyledComponents";
import { useAuthenticator } from "@webiny/app-security-cognito-authentication/hooks/useAuthenticator";
import { useSetNewPassword } from "@webiny/app-security-cognito-authentication/hooks/useSetNewPassword";

const SetNewPassword = () => {
    const { checkingUser, changeState } = useAuthenticator();
    const { shouldRender, setPassword, error, loading } = useSetNewPassword();

    if (!shouldRender || checkingUser) {
        return null;
    }

    return (
        <StateContainer>
            <Form onSubmit={setPassword} submitOnEnter>
                {({ Bind, submit, data }) => {
                    const retypePasswordValidator = value => {
                        if (value !== data.password) {
                            throw Error("Passwords do not match!");
                        }
                    };

                    return (
                        <>
                            <Elevation z={2}>
                                <InnerContent>
                                    {loading && <CircularProgress />}
                                    <Title>
                                        <h1>
                                            <Typography use="headline4">
                                                Set New Password
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
                                                name="code"
                                                validators={validation.create("required")}
                                            >
                                                <Input
                                                    autoComplete="off"
                                                    label={"Password reset code"}
                                                    outlined={true}
                                                    description={
                                                        "Enter the code we sent to your email."
                                                    }
                                                />
                                            </Bind>
                                        </Cell>
                                        <Cell span={12}>
                                            <Bind
                                                name="password"
                                                validators={validation.create("required")}
                                            >
                                                <Input
                                                    autoComplete={"off"}
                                                    type={"password"}
                                                    label={"New password"}
                                                    outlined={true}
                                                    description={"Enter your new password."}
                                                />
                                            </Bind>
                                        </Cell>
                                        <Cell span={12}>
                                            <Bind
                                                name="retypePassword"
                                                validators={[
                                                    validation.create("required"),
                                                    retypePasswordValidator
                                                ]}
                                            >
                                                <Input
                                                    type={"password"}
                                                    label={"Retype password"}
                                                    outlined={true}
                                                    description={
                                                        "Enter your new password once more."
                                                    }
                                                />
                                            </Bind>
                                        </Cell>
                                        <Cell span={12} className={alignRight}>
                                            <ButtonPrimary onClick={submit}>
                                                {"Set new password"}
                                            </ButtonPrimary>
                                        </Cell>
                                    </Grid>
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
                    );
                }}
            </Form>
        </StateContainer>
    );
};

export default SetNewPassword;
