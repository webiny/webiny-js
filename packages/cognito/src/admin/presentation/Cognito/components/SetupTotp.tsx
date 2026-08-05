import React from "react";
import { Button, Grid, Input, Alert, Text } from "@webiny/admin-ui";
import { makeDecoratable } from "@webiny/app-admin";
import { Form, Bind } from "@webiny/form";
import { validation } from "@webiny/validation";
import { View } from "./View.js";
import type { SetupTotpVM } from "~/admin/presentation/Cognito/abstractions.js";

export interface SetupTotpProps {
    vm: SetupTotpVM;
    onSubmit: (code: string) => void;
}

export const SetupTotp = makeDecoratable("CognitoSetupTotp", (props: SetupTotpProps) => {
    const { vm, onSubmit } = props;

    return (
        <View.Container>
            <Form<{ code: string }> onSubmit={data => onSubmit(data.code)} submitOnEnter>
                {({ submit }) => (
                    <View.Content>
                        <View.Title
                            title={"Set up two-factor authentication"}
                            description={
                                "Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code to verify."
                            }
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
                                <div className={"flex justify-center my-md"}>
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(vm.qrCodeUri)}`}
                                        alt={"TOTP QR Code"}
                                        width={200}
                                        height={200}
                                    />
                                </div>
                            </Grid.Column>
                            <Grid.Column span={12}>
                                <Text size={"sm"} className={"text-neutral-strong"}>
                                    {"Can't scan the code? Enter this key manually:"}
                                </Text>
                                <Text
                                    as={"div"}
                                    size={"sm"}
                                    className={"font-mono mt-xs select-all break-all"}
                                >
                                    {vm.sharedSecret}
                                </Text>
                            </Grid.Column>
                            <Grid.Column span={12}>
                                <Bind name="code" validators={validation.create("required")}>
                                    <Input
                                        label={"Verification Code"}
                                        description={
                                            "Enter the 6-digit code from your authenticator app."
                                        }
                                        autoComplete={"one-time-code"}
                                        inputMode={"numeric"}
                                    />
                                </Bind>
                            </Grid.Column>
                            <Grid.Column span={12}>
                                <div className={"flex justify-end"}>
                                    <Button
                                        text={"Verify & Enable"}
                                        onClick={submit}
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
});
