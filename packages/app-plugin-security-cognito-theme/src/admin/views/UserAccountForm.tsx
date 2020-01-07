import React from "react";
import { Cell, Grid } from "@webiny/ui/Grid";
import { validation } from "@webiny/validation";
import { Input } from "@webiny/ui/Input";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-plugin-security-cognito-theme/users/account");

const UserAccountForm = ({ Bind, data, fields }) => {
    return (
        <Grid>
            <Cell span={3}>
                <Grid>
                    <Cell span={12}>{fields.avatar}</Cell>
                </Grid>
            </Cell>
            <Cell span={9}>
                <Grid>
                    <Cell span={12}>{fields.email}</Cell>
                    <Cell span={12}>
                        <Bind name="password" validators={validation.create("password")}>
                            <Input
                                autoComplete="off"
                                description={data.id && t`Type a new password to reset it.`}
                                type="password"
                                label={t`Password`}
                            />
                        </Bind>
                    </Cell>
                    <Cell span={12}>{fields.firstName}</Cell>
                    <Cell span={12}>{fields.lastName}</Cell>
                </Grid>
            </Cell>
        </Grid>
    );
};

export default UserAccountForm;
