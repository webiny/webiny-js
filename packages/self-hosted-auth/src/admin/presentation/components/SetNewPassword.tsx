import React from "react";
import { Button } from "@webiny/admin-ui";
import { Input } from "@webiny/admin-ui";
import { OverlayLoader } from "@webiny/admin-ui";
import { makeDecoratable } from "@webiny/app-admin";
import { Form } from "@webiny/form";
import { Bind } from "@webiny/form";
import { useForm } from "@webiny/form";
import { validation } from "@webiny/validation";
import { View } from "./View.js";
import { Grid } from "./View.js";
import { Message } from "./Message.js";
import { FooterSignIn } from "./FooterSignIn.js";
import type { FormVM } from "../abstractions.js";

export interface SetNewPasswordProps {
    vm: FormVM;
    onSetNewPassword: (code: string, password: string) => void;
    onCancel: () => void;
}

export const SetNewPassword = makeDecoratable(
    "SelfHostedSetNewPassword",
    (props: SetNewPasswordProps) => {
        const { vm, onSetNewPassword, onCancel } = props;

        return (
            <View.Container>
                <Form
                    onSubmit={(data: any) => onSetNewPassword(data.code, data.password)}
                    submitOnEnter
                >
                    {({ submit }) => (
                        <View.Content>
                            {vm.isLoading ? (
                                <OverlayLoader text={"Setting your password..."} />
                            ) : null}
                            <View.Title title={"Set new password"} />
                            <Message message={vm.message} />

                            <Grid>
                                <Grid.Column span={12}>
                                    <Bind name={"code"} validators={validation.create("required")}>
                                        <Input
                                            label={"Verification code"}
                                            description={"Enter the code we sent to your email."}
                                            autoComplete={"one-time-code"}
                                            data-testid={"reset-code-input"}
                                        />
                                    </Bind>
                                </Grid.Column>
                                <Grid.Column span={12}>
                                    <Bind
                                        name={"password"}
                                        validators={validation.create("required,minLength:8")}
                                    >
                                        <Input
                                            type={"password"}
                                            label={"New password"}
                                            description={"At least 8 characters."}
                                            autoComplete={"new-password"}
                                        />
                                    </Bind>
                                </Grid.Column>
                                <Grid.Column span={12}>
                                    <RetypePassword />
                                </Grid.Column>
                                <Grid.Column span={12}>
                                    <div className={"flex items-center justify-between"}>
                                        <FooterSignIn onSignIn={onCancel} />
                                        <Button
                                            text={"Reset password"}
                                            data-testid={"reset-password-button"}
                                            onClick={submit}
                                            containerClassName={"ml-auto"}
                                            disabled={vm.isLoading}
                                        />
                                    </div>
                                </Grid.Column>
                            </Grid>
                        </View.Content>
                    )}
                </Form>
            </View.Container>
        );
    }
);

const RetypePassword = () => {
    const form = useForm();

    const matchOriginalValidator = (value: string) => {
        if (value !== form.getValue("password")) {
            throw Error("Passwords do not match.");
        }
    };

    return (
        <Bind
            name={"confirmPassword"}
            validators={[validation.create("required"), matchOriginalValidator]}
        >
            <Input
                type={"password"}
                label={"Retype password"}
                description={"Enter your new password once more."}
                autoComplete={"new-password"}
            />
        </Bind>
    );
};
