import React from "react";
import { Cell, Grid } from "@webiny/ui/Grid";
import { validation } from "@webiny/validation";
import { Input } from "@webiny/ui/Input";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-plugin-security-cognito-theme/users/form");

const UserForm = ({ Bind, data, fields }) => {
    return (
        <Grid>
            <Cell span={6}>
                <Grid>
                    <Cell span={12}>{fields.email}</Cell>
                    <Cell span={12}>
                        <Bind
                            name="password"
                            validators={validation.create(
                                data.id ? "password" : "required,password"
                            )}
                        >
                            <Input
                                autoComplete="off"
                                description={data.id && t`Type a new password to reset it.`}
                                type="password"
                                label={t`Password`}
                            />
                        </Bind>
                    </Cell>
                </Grid>
            </Cell>
            <Cell span={6}>
                <Grid>
                    <Cell span={12}>{fields.avatar}</Cell>
                </Grid>
            </Cell>
            <Cell span={6}>{fields.firstName}</Cell>
            <Cell span={6}>{fields.lastName}</Cell>
            <Cell span={12}>{fields.groups}</Cell>
            <Cell span={12}>{fields.roles}</Cell>
        </Grid>
    );
};

export default UserForm;
