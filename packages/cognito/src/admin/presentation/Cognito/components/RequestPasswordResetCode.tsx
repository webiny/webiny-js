import React from "react";
import { Button, Grid, Input, Alert, Link, Text } from "@webiny/admin-ui";
import { Form, Bind } from "@webiny/form";
import { validation } from "@webiny/validation";
import { View } from "./View.js";
import type { RequestPasswordResetCodeVM } from "~/admin/presentation/Cognito/abstractions.js";
import { FooterSignIn } from "~/admin/presentation/Cognito/components/FooterSignIn.js";

export interface ForgotPasswordProps {
    vm: RequestPasswordResetCodeVM;
    onRequestCode: (username: string) => void;
    onCancel: () => void;
}

export const RequestPasswordResetCode = (props: ForgotPasswordProps) => {
    const { vm, ...actions } = props;

    return (
        <View.Container>
            <Form onSubmit={(data: any) => actions.onRequestCode(data.username)} submitOnEnter>
                {({ submit }) => (
                    <View.Content>
                        <View.Title
                            title={"Password recovery"}
                            description={"Request a password reset code."}
                        />

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
                                        text={"Send me the code"}
                                        onClick={submit}
                                        disabled={vm.isLoading}
                                    />
                                    <FooterSignIn onSignIn={actions.onCancel} />
                                </div>
                            </Grid.Column>
                        </Grid>
                    </View.Content>
                )}
            </Form>
        </View.Container>
    );
};
