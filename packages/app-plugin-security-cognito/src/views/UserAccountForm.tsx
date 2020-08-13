import React from "react";
import { Cell, Grid } from "@webiny/ui/Grid";
import { validation } from "@webiny/validation";
import { Input } from "@webiny/ui/Input";
import { i18n } from "@webiny/app/i18n";
import { Accordion, AccordionItem } from "@webiny/ui/Accordion";
import { ReactComponent as SettingsIcon } from "./../assets/icons/settings-24px.svg";
import { ReactComponent as SecurityIcon } from "./../assets/icons/security-24px.svg";

const t = i18n.ns("app-plugin-security-cognito-theme/users/account");

const UserAccountForm = ({ Bind, data, fields }) => {
    return (
        <>
            <Accordion elevation={0}>
                <AccordionItem
                    description="Show Account bio information"
                    title="Bio"
                    icon={<SettingsIcon />}
                >
                    <Grid>
                        <Cell span={12}>{fields.email}</Cell>
                        <Cell span={12}>
                            <Bind name="password">
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
                </AccordionItem>
                <AccordionItem
                    description="Show Personal Access Tokens"
                    title="Personal Access Tokens"
                    icon={<SecurityIcon />}
                >
                    {fields.personalAccessTokens}
                </AccordionItem>
            </Accordion>
        </>
    );
};

export default UserAccountForm;
