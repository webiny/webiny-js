import React from "react";
import { Cell, Grid } from "@webiny/ui/Grid";
import { validation } from "@webiny/validation";
import { Input } from "@webiny/ui/Input";
import { i18n } from "@webiny/app/i18n";
import Section from "@webiny/ui/Section";
import styled from "@emotion/styled";

const t = i18n.ns("app-plugin-security-cognito-theme/users/account");

const RenderSection = styled("div")({
    backgroundColor: "var(--mdc-theme-background)",
    height: "100%",
    padding: 25
});

const UserAccountForm = ({ Bind, data, fields }) => {
    return (
        <RenderSection>
            <Section title="Avatar">
                <Grid>
                    <Cell span={12}>{fields.avatar}</Cell>
                </Grid>
            </Section>
            <Section title="Bio">
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
            </Section>
            <Section title="Personal Access Tokens">
                <Cell span={12}>{fields.personalAccessTokens}</Cell>
            </Section>
        </RenderSection>
    );
};

export default UserAccountForm;
