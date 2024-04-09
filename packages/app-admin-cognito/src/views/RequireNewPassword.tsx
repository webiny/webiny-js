import React from "react";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Input } from "@webiny/ui/Input";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { useRequireNewPassword } from "@webiny/app-cognito-authenticator/hooks/useRequireNewPassword";
import { View } from "~/components/View";
import { alignRight, Title } from "~/components/StyledComponents";

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
                        <View.Title title={"Set New Password"} />
                        <Grid>
                            <Cell span={12}>
                                <Bind name="password" validators={validation.create("required")}>
                                    <Input
                                        type={"password"}
                                        label={"New password"}
                                        outlined={true}
                                    />
                                </Bind>
                            </Cell>
                        </Grid>
                        {requiredAttributes.length > 0 && (
                            <Title>
                                <Typography use="headline6">
                                    Please enter additional information
                                </Typography>
                            </Title>
                        )}
                        <Grid>
                            {requiredAttributes.map(name => (
                                <Cell key={name} span={12}>
                                    <Bind name={name} validators={validation.create("required")}>
                                        <Input label={sentenceCase(name)} outlined={true} />
                                    </Bind>
                                </Cell>
                            ))}
                        </Grid>

                        <Grid>
                            <Cell span={12} className={alignRight}>
                                <ButtonPrimary
                                    data-testid="submit-sign-in-form-button"
                                    onClick={ev => {
                                        submit(ev);
                                    }}
                                >
                                    {"Set password"}
                                </ButtonPrimary>
                            </Cell>
                        </Grid>
                    </View.Content>
                )}
            </Form>
        </View.Container>
    );
};
