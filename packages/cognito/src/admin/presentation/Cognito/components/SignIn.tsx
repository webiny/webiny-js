import React from "react";
import { Grid, Input, Alert, Link, Button, Text, OverlayLoader } from "@webiny/admin-ui";
import { Form, Bind } from "@webiny/form";
import { validation } from "@webiny/validation";
import { makeDecoratable } from "@webiny/app-admin";
import { View } from "./View.js";
import { FederatedLogin } from "./FederatedLogin.js";
import { Divider } from "./Divider.js";
import type { SignInVM } from "~/admin/presentation/Cognito/abstractions.js";

export interface SignInProps {
    vm: SignInVM;
    onSubmit: (username: string, password: string) => void;
    onForgotPassword: () => void;
}

export const SignIn = makeDecoratable("CognitoSignIn", (props: SignInProps) => {
    const { vm, onSubmit, onForgotPassword } = props;
    const showCredentials = vm.allowCredentialsLogin;
    const showFederated = vm.federatedProviders.length > 0;

    return (
        <View.Container>
            <Form onSubmit={(data: any) => onSubmit(data.username, data.password)} submitOnEnter>
                {({ submit }) => (
                    <View.Content>
                        {vm.isLoading ? <OverlayLoader text={"Authenticating..."} /> : null}
                        <View.Title title={vm.title} description={vm.description} />

                        {vm.message && (
                            <div className={"mb-lg"}>
                                <Alert title={vm.message.title} type={vm.message.type}>
                                    {vm.message.text}
                                </Alert>
                            </div>
                        )}

                        {showCredentials && (
                            <Grid>
                                <Grid.Column span={12}>
                                    <Bind
                                        name="username"
                                        validators={validation.create("required,email")}
                                        beforeChange={(val: string, cb: (value: string) => void) =>
                                            cb(val.toLowerCase())
                                        }
                                    >
                                        <Input label={"Email"} />
                                    </Bind>
                                </Grid.Column>
                                <Grid.Column span={12}>
                                    <Bind
                                        name="password"
                                        validators={validation.create("required")}
                                    >
                                        <Input
                                            type={"password"}
                                            label={"Password"}
                                            autoComplete={"off"}
                                        />
                                    </Bind>
                                </Grid.Column>
                                <Grid.Column span={12}>
                                    <div
                                        className={
                                            "flex flex-row-reverse items-center justify-between"
                                        }
                                    >
                                        <Button
                                            text={"Submit"}
                                            data-testid="submit-sign-in-form-button"
                                            onClick={submit}
                                            disabled={vm.isLoading}
                                        />
                                        <Text as={"div"} size={"sm"}>
                                            <Link to="#" onClick={onForgotPassword}>
                                                Forgot password?
                                            </Link>
                                        </Text>
                                    </div>
                                </Grid.Column>
                            </Grid>
                        )}

                        {showCredentials && showFederated && <Divider />}

                        {showFederated && <FederatedLogin providers={vm.federatedProviders} />}
                    </View.Content>
                )}
            </Form>
        </View.Container>
    );
});
