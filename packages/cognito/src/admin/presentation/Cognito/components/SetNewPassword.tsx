import React from "react";
import { Button, Grid, Input, Alert } from "@webiny/admin-ui";
import { Form, Bind, useForm } from "@webiny/form";
import { validation } from "@webiny/validation";
import { View } from "./View.js";
import type { SetNewPasswordVM } from "~/admin/presentation/Cognito/abstractions.js";
import { FooterSignIn } from "~/admin/presentation/Cognito/components/FooterSignIn.js";
import { usePasswordValidator } from "~/admin/presentation/shared/usePasswordValidator.js";

export interface SetNewPasswordProps {
    vm: SetNewPasswordVM;
    onSetNewPassword: (code: string, password: string) => void;
    onCancel: () => void;
}

export const SetNewPassword = (props: SetNewPasswordProps) => {
    const { vm, onSetNewPassword, onCancel } = props;
    const passwordValidator = usePasswordValidator();

    return (
        <View.Container>
            <Form
                onSubmit={(data: any) => onSetNewPassword(data.code, data.password)}
                submitOnEnter
            >
                {({ submit }) => (
                    <View.Content>
                        <View.Title title={"Set new password"} />

                        {vm.message && (
                            <div className={"mb-lg"}>
                                <Alert title={vm.message.title} type={vm.message.type}>
                                    {vm.message.text}
                                </Alert>
                            </div>
                        )}

                        <Grid>
                            <Grid.Column span={12}>
                                <Bind name="code" validators={validation.create("required")}>
                                    <Input
                                        label={"Verification Code"}
                                        description={"Enter the code we sent to your email."}
                                        autoComplete={"new-password"}
                                    />
                                </Bind>
                            </Grid.Column>
                            <Grid.Column span={12}>
                                <Bind
                                    name="password"
                                    validators={[validation.create("required"), passwordValidator]}
                                >
                                    <Input
                                        type={"password"}
                                        label={"New Password"}
                                        description={"Enter your new password."}
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
                                        text={"Reset Password"}
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
};

const RetypePassword = () => {
    const form = useForm();
    const matchOriginalValidator = (value: string) => {
        if (value !== form.getValue("password")) {
            throw Error(`Passwords do not match.`);
        }
    };

    return (
        <Bind
            name="confirmPassword"
            validators={[validation.create("required"), matchOriginalValidator]}
        >
            <Input
                type={"password"}
                label={"Retype Password"}
                description={"Enter your new password once more."}
                autoComplete={"new-password"}
            />
        </Bind>
    );
};
