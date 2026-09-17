import React from "react";
import { Button } from "@webiny/admin-ui";
import { Input } from "@webiny/admin-ui";
import { Link } from "@webiny/admin-ui";
import { OverlayLoader } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { makeDecoratable } from "@webiny/app-admin";
import { Form } from "@webiny/form";
import { Bind } from "@webiny/form";
import { validation } from "@webiny/validation";
import { View } from "./View.js";
import { Grid } from "./View.js";
import { Message } from "./Message.js";
import type { SignInVM } from "../abstractions.js";

export interface SignInProps {
    vm: SignInVM;
    onSubmit: (email: string, password: string) => void;
    onForgotPassword: () => void;
}

export const SignIn = makeDecoratable("SelfHostedSignIn", (props: SignInProps) => {
    const { vm, onSubmit, onForgotPassword } = props;

    return (
        <View.Container>
            <Form onSubmit={(data: any) => onSubmit(data.email, data.password)} submitOnEnter>
                {({ submit }) => (
                    <View.Content>
                        {vm.isLoading ? <OverlayLoader text={"Signing in..."} /> : null}
                        <View.Title title={"Sign in"} />
                        <Message message={vm.message} />

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
                                <div
                                    className={"flex flex-row-reverse items-center justify-between"}
                                >
                                    <Button
                                        text={"Submit"}
                                        data-testid={"submit-sign-in-form-button"}
                                        onClick={submit}
                                        disabled={vm.isLoading}
                                    />
                                    {vm.passwordResetEnabled && (
                                        <Text as={"div"} size={"sm"}>
                                            <Link
                                                to={"#"}
                                                onClick={onForgotPassword}
                                                data-testid={"forgot-password-link"}
                                            >
                                                Forgot password?
                                            </Link>
                                        </Text>
                                    )}
                                </div>
                            </Grid.Column>
                        </Grid>
                    </View.Content>
                )}
            </Form>
        </View.Container>
    );
});
