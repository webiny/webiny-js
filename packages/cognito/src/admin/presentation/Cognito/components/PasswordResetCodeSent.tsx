import React from "react";
import { Alert, Button, Grid, Text } from "@webiny/admin-ui";
import { View } from "./View.js";
import type { PasswordResetCodeSentVM } from "~/admin/presentation/Cognito/abstractions.js";
import { FooterSignIn } from "~/admin/presentation/Cognito/components/FooterSignIn.js";

export interface PasswordResetCodeSentProps {
    vm: PasswordResetCodeSentVM;
    onResendCode: () => void;
    onCodeAcquired: () => void;
    onCancel: () => void;
}

export const PasswordResetCodeSent = (props: PasswordResetCodeSentProps) => {
    const { vm, onResendCode, onCodeAcquired, onCancel } = props;

    return (
        <View.Container>
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
                        <Text>We have sent you a code to reset your password.</Text>
                    </Grid.Column>
                    <Grid.Column span={12}>
                        <Text>
                            Click the &quot;Resend code&quot; button below to resend the code in
                            case you haven&apos;t received it the first time.
                        </Text>
                    </Grid.Column>

                    <Grid.Column span={12}>
                        <div className={"flex items-center justify-between"}>
                            <FooterSignIn onSignIn={onCancel} />
                            <div className={"flex gap-x-sm"}>
                                <Button
                                    variant={"secondary"}
                                    text={"Resend code"}
                                    onClick={onResendCode}
                                />
                                <Button
                                    variant={"primary"}
                                    text={"I got the code!"}
                                    onClick={onCodeAcquired}
                                />
                            </div>
                        </div>
                    </Grid.Column>
                </Grid>
            </View.Content>
        </View.Container>
    );
};
