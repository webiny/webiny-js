import React from "react";
import { Button, OverlayLoader } from "@webiny/admin-ui";
import { makeDecoratable } from "@webiny/app-admin";
import { View, Grid } from "./View.js";
import { Message } from "./Message.js";
import { FooterSignIn } from "./FooterSignIn.js";
import type { ResetCodeSentVM } from "../abstractions.js";

export interface ResetCodeSentProps {
    vm: ResetCodeSentVM;
    onCodeAcquired: () => void;
    onResendCode: () => void;
    onCancel: () => void;
}

/**
 * The pause between asking for a code and typing one in. It exists so that a user who never gets
 * the mail has somewhere to ask again from, rather than abandoning a form they cannot complete.
 */
export const ResetCodeSent = makeDecoratable(
    "SelfHostedResetCodeSent",
    (props: ResetCodeSentProps) => {
        const { vm, onCodeAcquired, onResendCode, onCancel } = props;

        return (
            <View.Container>
                <View.Content>
                    {vm.isLoading ? <OverlayLoader text={"Sending a code..."} /> : null}
                    <View.Title
                        title={"Check your email"}
                        description={`If an account exists for ${vm.email}, a reset code is on its way. It is valid for a short time and can be used once.`}
                    />
                    <Message message={vm.message} />

                    <Grid>
                        <Grid.Column span={12}>
                            <div className={"flex items-center justify-between"}>
                                <Button
                                    text={"Send another code"}
                                    variant={"secondary"}
                                    data-testid={"resend-reset-code-button"}
                                    onClick={onResendCode}
                                    disabled={vm.isLoading}
                                />
                                <Button
                                    text={"I have the code"}
                                    data-testid={"have-reset-code-button"}
                                    onClick={onCodeAcquired}
                                    containerClassName={"ml-auto"}
                                    disabled={vm.isLoading}
                                />
                            </div>
                        </Grid.Column>
                        <Grid.Column span={12}>
                            <FooterSignIn onSignIn={onCancel} />
                        </Grid.Column>
                    </Grid>
                </View.Content>
            </View.Container>
        );
    }
);
