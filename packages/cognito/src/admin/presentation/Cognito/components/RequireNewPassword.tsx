import React from "react";
import { Button, Grid, Heading, Input } from "@webiny/admin-ui";
import { Form, Bind } from "@webiny/form";
import { validation } from "@webiny/validation";
import { View } from "./View.js";
import type { RequireNewPasswordVM } from "~/admin/presentation/Cognito/abstractions.js";

const sentenceCase = (str: string) => {
    const lower = str.toLowerCase();
    return lower[0].toUpperCase() + lower.substring(1);
};

export interface RequireNewPasswordProps {
    vm: RequireNewPasswordVM;
    onSubmit: (password: string, attributes: any) => void;
    onCancel: () => void;
}

type FormData = {
    password: string;
    requiredAttributes: Record<string, string>;
};

export const RequireNewPassword = (props: RequireNewPasswordProps) => {
    const { vm, onSubmit } = props;

    return (
        <View.Container>
            <Form<FormData>
                onSubmit={data => onSubmit(data.password, data.requiredAttributes)}
                submitOnEnter
            >
                {({ submit }) => (
                    <View.Content>
                        <View.Title title={"Set new password"} />
                        <Grid>
                            <Grid.Column span={12}>
                                <Bind name="password" validators={validation.create("required")}>
                                    <Input
                                        type={"password"}
                                        label={"New password"}
                                        autoComplete={"off"}
                                    />
                                </Bind>
                            </Grid.Column>

                            {vm.requiredAttributes.length > 0 ? (
                                <>
                                    <Grid.Column span={12}>
                                        <Heading level={6} className={"text-center"}>
                                            Please enter additional information
                                        </Heading>
                                    </Grid.Column>
                                    {vm.requiredAttributes.map(attr => (
                                        <Grid.Column key={attr} span={12}>
                                            <Bind name={`requiredAttributes.${attr}`}>
                                                <Input label={sentenceCase(attr)} />
                                            </Bind>
                                        </Grid.Column>
                                    ))}
                                </>
                            ) : (
                                <></>
                            )}

                            <Grid.Column span={12}>
                                <Button
                                    text={"Confirm"}
                                    onClick={submit}
                                    size="lg"
                                    disabled={vm.isLoading}
                                />
                            </Grid.Column>
                        </Grid>
                    </View.Content>
                )}
            </Form>
        </View.Container>
    );
};
