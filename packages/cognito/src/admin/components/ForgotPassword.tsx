import React from "react";
import { Button, Grid, Input, Alert, Link, Text } from "@webiny/admin-ui";
import { Form, Bind } from "@webiny/form";
import { validation } from "@webiny/validation";
import { View } from "./View.js";
import type { ForgotPasswordVM } from "../features/Cognito/abstractions.js";

export interface ForgotPasswordProps {
    vm: ForgotPasswordVM;
    onSubmit: (username: string) => void;
    onCancel: () => void;
}

export const ForgotPassword = (props: ForgotPasswordProps) => {
    const { vm, onSubmit, onCancel } = props;

    return (
        <View.Container>
            <Form onSubmit={(data: any) => onSubmit(data.username)} submitOnEnter>
                {({ Bind, submit }) => (
                    <View.Content>
                        <View.Title title={"Reset your password"} />

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
                                <div
                                    className={"flex flex-row-reverse items-center justify-between"}
                                >
                                    <Button
                                        text={"Send Code"}
                                        onClick={submit}
                                        disabled={vm.isLoading}
                                    />
                                    <Text as={"div"} size={"sm"} onClick={onCancel}>
                                        <Link to="#">Back to Sign In</Link>
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
