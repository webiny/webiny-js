import React from "react";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Input } from "@webiny/ui/Input";
import { Grid, Cell } from "@webiny/ui/Grid";
import { CircularProgress } from "@webiny/ui/Progress";
import { View } from "~/components/View";
import { alignRight, errorMessage } from "~/components/StyledComponents";
import { useAuthenticator } from "@webiny/app-cognito-authenticator/hooks/useAuthenticator";
import {
    useSetNewPassword,
    UseSetNewPasswordCallableParams
} from "@webiny/app-cognito-authenticator/hooks/useSetNewPassword";

export const SetNewPassword = () => {
    const { changeState } = useAuthenticator();
    const { shouldRender, setPassword, error, loading } = useSetNewPassword();

    if (!shouldRender) {
        return null;
    }

    return (
        <Form<UseSetNewPasswordCallableParams> onSubmit={data => setPassword(data)} submitOnEnter>
            {({ Bind, submit, data }) => {
                const retypePasswordValidator = (value: string) => {
                    if (value !== data.password) {
                        throw Error("Passwords do not match!");
                    }
                };

                return (
                    <View.Container>
                        <View.Content>
                            {loading && <CircularProgress />}
                            <View.Title title={"Set New Password"} />

                            {error && (
                                <Grid>
                                    <Cell span={12} className={errorMessage}>
                                        {error}
                                    </Cell>
                                </Grid>
                            )}

                            <Grid>
                                <Cell span={12} data-testid="password-reset-code">
                                    <Bind name="code" validators={validation.create("required")}>
                                        <Input
                                            autoComplete="off"
                                            label={"Password reset code"}
                                            outlined={true}
                                            description={"Enter the code we sent to your email."}
                                        />
                                    </Bind>
                                </Cell>
                                <Cell span={12} data-testid="new-password-input">
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
                                <Cell span={12} data-testid="retype-password-input">
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
                                            description={"Enter your new password once more."}
                                        />
                                    </Bind>
                                </Cell>
                                <Cell span={12} className={alignRight}>
                                    <ButtonPrimary
                                        data-testid="submit-btn-new-psw"
                                        onClick={ev => {
                                            submit(ev);
                                        }}
                                    >
                                        {"Set new password"}
                                    </ButtonPrimary>
                                </Cell>
                            </Grid>
                        </View.Content>
                        <View.Footer>
                            Want to sign in?&nbsp;
                            <a href={"#"} onClick={() => changeState("signIn")}>
                                Sign in
                            </a>
                        </View.Footer>
                    </View.Container>
                );
            }}
        </Form>
    );
};
