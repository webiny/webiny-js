import React from "react";
import { Button, Input, OverlayLoader } from "@webiny/admin-ui";
import { makeDecoratable } from "@webiny/app-admin";
import { Form, Bind } from "@webiny/form";
import { validation } from "@webiny/validation";
import { View, Grid } from "./View.js";
import { Message } from "./Message.js";
import { FooterSignIn } from "./FooterSignIn.js";
import type { FormVM } from "../abstractions.js";

export interface RequestResetCodeProps {
    vm: FormVM;
    onRequestCode: (email: string) => void;
    onCancel: () => void;
}

export const RequestResetCode = makeDecoratable(
    "SelfHostedRequestResetCode",
    (props: RequestResetCodeProps) => {
        const { vm, onRequestCode, onCancel } = props;

        return (
            <View.Container>
                <Form onSubmit={(data: any) => onRequestCode(data.email)} submitOnEnter>
                    {({ submit }) => (
                        <View.Content>
                            {vm.isLoading ? <OverlayLoader text={"Sending a code..."} /> : null}
                            <View.Title
                                title={"Password recovery"}
                                description={"We will email you a code to reset your password."}
                            />
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
                                    <div className={"flex items-center justify-between"}>
                                        <FooterSignIn onSignIn={onCancel} />
                                        <Button
                                            text={"Send code"}
                                            data-testid={"request-reset-code-button"}
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
