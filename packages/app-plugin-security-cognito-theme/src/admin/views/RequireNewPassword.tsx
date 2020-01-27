import * as React from "react";
import { lowerCase } from "lodash";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Input } from "@webiny/ui/Input";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { Elevation } from "@webiny/ui/Elevation";
import StateContainer from "./StateContainer";
import { alignRight, InnerContent, Title } from "./StyledComponents";
import { RequireNewPasswordChildrenProps } from "@webiny/app-plugin-security-cognito/types";

const sentenceCase = str => {
    const lower = lowerCase(str);
    return lower[0].toUpperCase() + lower.substring(1);
};

const RequireNewPassword: React.FC<RequireNewPasswordChildrenProps> = ({
    confirm,
    requiredAttributes
}) => {
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
                                <Typography use="headline4">Set new password</Typography>
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
                                    <ButtonPrimary onClick={submit}>
                                        {"Set password"}
                                    </ButtonPrimary>
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
