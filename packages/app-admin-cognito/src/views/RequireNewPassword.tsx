import React from "react";
import { Button, Grid, Heading, Input } from "@webiny/admin-ui";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import { useRequireNewPassword } from "@webiny/app-cognito-authenticator/hooks/useRequireNewPassword.js";
import { View } from "~/components/View.js";

const sentenceCase = (str: string) => {
    const lower = str.toLowerCase();
    return lower[0].toUpperCase() + lower.substring(1);
};

export const RequireNewPassword = () => {
    const { shouldRender, requiredAttributes, confirm } = useRequireNewPassword();

    if (!shouldRender) {
        return null;
    }

    return (
        <View.Container>
            <Form
                onSubmit={({ password, requiredAttributes }) =>
                    confirm({ password, requiredAttributes })
                }
                submitOnEnter
            >
                {({ Bind, submit }) => (
                    <View.Content>
                        <View.Title title={"Set new password"} />
                        <Grid>
                            <Grid.Column span={12}>
                                <Bind name="password" validators={validation.create("required")}>
                                    <Input
                                        type={"password"}
                                        label={"New password"}
                                        size={"lg"}
                                        autoComplete={"off"}
                                    />
                                </Bind>
                            </Grid.Column>

                            <>
                                {requiredAttributes.length > 0 && (
                                    <Grid.Column span={12}>
                                        <Heading level={6} className={"text-center"}>
                                            Please enter additional information
                                        </Heading>
                                    </Grid.Column>
                                )}
                            </>

                            <>
                                {requiredAttributes.map(name => (
                                    <Grid.Column key={name} span={12}>
                                        <Bind
                                            name={name}
                                            validators={validation.create("required")}
                                        >
                                            <Input label={sentenceCase(name)} size={"lg"} />
                                        </Bind>
                                    </Grid.Column>
                                ))}
                            </>

                            <Grid.Column span={12} className={"text-right"}>
                                <Button
                                    text={"Set password"}
                                    data-testid="submit-sign-in-form-button"
                                    onClick={ev => {
                                        submit(ev);
                                    }}
                                    size={"lg"}
                                />
                            </Grid.Column>
                        </Grid>
                    </View.Content>
                )}
            </Form>
        </View.Container>
    );
};
