import React from "react";
import { Button, Grid, Input, Alert } from "@webiny/admin-ui";
import { Form, Bind } from "@webiny/form";
import { validation } from "@webiny/validation";
import { View } from "./View.js";
import type { ConfirmTotpCodeVM } from "~/admin/presentation/Cognito/abstractions.js";
import { FooterSignIn } from "~/admin/presentation/Cognito/components/FooterSignIn.js";

export interface ConfirmTotpCodeProps {
    vm: ConfirmTotpCodeVM;
    onSubmit: (code: string) => void;
    onCancel: () => void;
}

export const ConfirmTotpCode = (props: ConfirmTotpCodeProps) => {
    const { vm, onSubmit, onCancel } = props;

    return (
        <View.Container>
            <Form<{ code: string }> onSubmit={data => onSubmit(data.code)} submitOnEnter>
                {({ submit }) => (
                    <View.Content>
                        <View.Title
                            title={"Two-factor authentication"}
                            description={"Enter the 6-digit code from your authenticator app."}
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
                                <Bind name="code" validators={validation.create("required")}>
                                    <Input
                                        label={"Verification Code"}
                                        autoComplete={"one-time-code"}
                                        inputMode={"numeric"}
                                    />
                                </Bind>
                            </Grid.Column>
                            <Grid.Column span={12}>
                                <div className={"flex items-center justify-between"}>
                                    <FooterSignIn onSignIn={onCancel} />
                                    <Button
                                        text={"Verify"}
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
