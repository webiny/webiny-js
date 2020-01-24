import React from "react";
import { Cell, Grid } from "@webiny/ui/Grid";
import { validation } from "@webiny/validation";
import { Input } from "@webiny/ui/Input";
import { Alert } from "@webiny/ui/Alert";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-plugin-security-cognito-theme/install-form");

const InstallForm = ({ Bind, fields, error }) => {
    return (
        <Grid>
            {error && (
                <Cell span={12}>
                    <Alert title={"Something went wrong"} type={"danger"}>
                        {error.message}
                    </Alert>
                </Cell>
            )}
            <Cell span={12}>Let&apos;s create your admin user:</Cell>
            <Cell span={12}>{fields.firstName}</Cell>
            <Cell span={12}>{fields.lastName}</Cell>
            <Cell span={12}>{fields.email}</Cell>
            <Cell span={12}>
                <Bind name="password" validators={validation.create("required,password")}>
                    <Input autoComplete="off" type="password" label={t`Password`} />
                </Bind>
            </Cell>
            <Cell span={12}>
                Other resources that will be installed:
                <ul>
                    <li>- core security roles</li>
                    <li>- core security groups</li>
                </ul>
            </Cell>
        </Grid>
    );
};

export default InstallForm;
