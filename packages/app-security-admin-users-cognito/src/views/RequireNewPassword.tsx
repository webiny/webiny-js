import * as React from "react";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Input } from "@webiny/ui/Input";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { Elevation } from "@webiny/ui/Elevation";
import { useAuthenticator } from "@webiny/app-security-cognito-authentication/hooks/useAuthenticator";
import { useRequireNewPassword } from "@webiny/app-security-cognito-authentication/hooks/useRequireNewPassword";
import StateContainer from "./StateContainer";
import { alignRight, InnerContent, Title } from "./StyledComponents";

const sentenceCase = str => {
    const lower = str.toLowerCase();
    return lower[0].toUpperCase() + lower.substring(1);
};

const RequireNewPassword = () => {
    const { checkingUser } = useAuthenticator();
    const { shouldRender, requiredAttributes, confirm } = useRequireNewPassword();

    if (!shouldRender || checkingUser) {
        return null;
    }

    return (
        <StateContainer>
            <Form
                onSubmit={({ password, requiredAttributes }) =>
                    confirm({ password, requiredAttributes })
                }
                submitOnEnter
            >
                {({ Bind, submit }) => (
                    <Elevation z={2}>
                        <InnerContent>
                            <Title>
                                <Typography use="headline4">Set New Password</Typography>
                            </Title>

                            <Grid>
                                <Cell span={12}>
                                    <Bind
                                        name="password"
                                        validators={validation.create("required")}
                                    >
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
                                        <Bind
                                            name={name}
                                            validators={validation.create("required")}
                                        >
                                            <Input label={sentenceCase(name)} outlined={true} />
                                        </Bind>
                                    </Cell>
                                ))}
                            </Grid>

                            <Grid>
                                <Cell span={12} className={alignRight}>
                                    <ButtonPrimary onClick={submit}>{"Set password"}</ButtonPrimary>
                                </Cell>
                            </Grid>
                        </InnerContent>
                    </Elevation>
                )}
            </Form>
        </StateContainer>
    );
};

export default RequireNewPassword;
