import React from "react";
import Auth from "@aws-amplify/auth";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { validation } from "@webiny/validation";
import Authentication from "./components/Authentication";

export default config => {
    // Configure Amplify Auth
    Auth.configure(config);

    return {
        name: "security-authentication-provider-cognito",
        type: "security-authentication-provider",
        securityProviderHook({ onIdToken }) {
            const renderAuthentication = () => {
                return <Authentication onIdToken={onIdToken} />;
            };

            const logout = async () => {
                await Auth.signOut();
            };

            const getIdToken = async () => {
                const cognitoUser = await Auth.currentSession();
                return cognitoUser ? cognitoUser.idToken.jwtToken : null;
            };

            return { getIdToken, renderAuthentication, logout };
        },
        renderUserAccountForm({ Bind, data, t, fields }) {
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
        },
        renderUserForm({ Bind, data, t, fields }) {
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
        }
    };
};
