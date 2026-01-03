import React from "react";
import { Button, Grid, Input, Alert, Link, Text } from "@webiny/admin-ui";
import { Form, Bind } from "@webiny/form";
import { validation } from "@webiny/validation";
import { View } from "./View.js";
import type { SetNewPasswordVM } from "../features/Cognito/abstractions.js";

export interface SetNewPasswordProps {
    vm: SetNewPasswordVM;
    onSubmit: (username: string, code: string, password: string) => void;
    onCancel: () => void;
}

export const SetNewPassword = (props: SetNewPasswordProps) => {
    const { vm, onSubmit, onCancel } = props;

    return (
        <View.Container>
            <Form
                onSubmit={(data: any) => onSubmit(data.username, data.code, data.password)}
                submitOnEnter
            >
                {({ Bind, submit }) => (
                    <View.Content>
                        <View.Title title={"Enter verification code"} />

                        {vm.message && (
                            <div className={"mb-lg"}>
                                <Alert title={vm.message.title} type={vm.message.type}>
                                    {vm.message.text}
                                </Alert>
                            </div>
                        )}

                        <Grid>
                            <Grid.Column span={12}>
                                <Bind
                                    name="username"
                                    validators={validation.create("required,email")}
                                >
                                    <Input label={"Email"} />
                                </Bind>
                            </Grid.Column>
                            <Grid.Column span={12}>
                                <Bind name="code" validators={validation.create("required")}>
                                    <Input label={"Verification Code"} />
                                </Bind>
                            </Grid.Column>
                            <Grid.Column span={12}>
                                <Bind name="password" validators={validation.create("required")}>
                                    <Input
                                        type={"password"}
                                        label={"New Password"}
                                        autoComplete={"off"}
                                    />
                                </Bind>
                            </Grid.Column>
                            <Grid.Column span={12}>
                                <div
                                    className={"flex flex-row-reverse items-center justify-between"}
                                >
                                    <Button text={"Reset Password"} onClick={submit} />
                                    <Text as={"div"} size={"sm"}>
                                        <Link to="#" onClick={onCancel}>
                                            Back to Sign In
                                        </Link>
                                    </Text>
                                </div>
                            </Grid.Column>
                        </Grid>
                    </View.Content>
                )}
            </Form>
        </View.Container>
    );
};
