// @flow
import * as React from "react";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Input } from "@webiny/ui/Input";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { Elevation } from "@webiny/ui/Elevation";
import StateContainer from "./StateContainer";
import { alignRight, InnerContent, Title } from "../StyledComponents";
import RequireNewPassword from "../cognito/states/RequireNewPassword";

export default (authProps: Object) => {
    return (
        <RequireNewPassword {...authProps}>
            {({ confirm }) => (
                <StateContainer>
                    <Form onSubmit={data => confirm(data)} submitOnEnter>
                        {({ Bind, submit }) => (
                            <Elevation z={2}>
                                <InnerContent>
                                    <Title>
                                        <h1>
                                            <Typography use="headline4">
                                                Set new password
                                            </Typography>
                                        </h1>
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
                                                    box={true}
                                                />
                                            </Bind>
                                        </Cell>
                                    </Grid>

                                    <Grid>
                                        <Cell span={12} className={alignRight}>
                                            <ButtonPrimary raised onClick={submit}>
                                                {"Set password"}
                                            </ButtonPrimary>
                                        </Cell>
                                    </Grid>
                                </InnerContent>
                            </Elevation>
                        )}
                    </Form>
                </StateContainer>
            )}
        </RequireNewPassword>
    );
};
