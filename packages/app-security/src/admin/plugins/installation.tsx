import gql from "graphql-tag";
import React, { useState, useCallback } from "react";
import { useApolloClient } from "react-apollo";
import { Form } from "@webiny/form";
import { i18n } from "@webiny/app/i18n";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Input } from "@webiny/ui/Input";
import { Checkbox } from "@webiny/ui/Checkbox";
import { Alert } from "@webiny/ui/Alert";
import { Typography } from "@webiny/ui/Typography";
import { Grid, Cell } from "@webiny/ui/Grid";
import { CircularProgress } from "@webiny/ui/Progress";
import { validation } from "@webiny/validation";
import { getPlugin } from "@webiny/plugins";
import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";
import { SecurityViewInstallationFormPlugin } from "@webiny/app-security/types";

const t = i18n.ns("app-security/admin/installation");

const IS_INSTALLED = gql`
    {
        security {
            isInstalled {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;

const INSTALL = gql`
    mutation InstallSecurity($data: SecurityInstallInput!) {
        security {
            install(data: $data) {
                data {
                    user
                    authUser
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

const Install = ({ onInstalled }) => {
    const auth = getPlugin<SecurityViewInstallationFormPlugin>("security-view-install-form");

    if (!auth) {
        throw Error(
            `You must register a "security-view-install-form" plugin to render installation form!`
        );
    }

    const client = useApolloClient();
    const [loading, setLoading] = useState(false);
    const [authUserMessage, setAuthUserMessage] = useState(null);
    const [error, setError] = useState(null);

    const onSubmit = useCallback(async ({ subscribed, ...form}) => {
        setLoading(true);
        setError(null);
        if (typeof auth.onSubmit === "function") {
            try {
                await auth.onSubmit({ data: form });
            } catch (err) {
                setLoading(false);
                setError(err);
                return;
            }
        }

        const { data: res } = await client.mutate({ mutation: INSTALL, variables: { data: form } });
        setLoading(false);
        const { error, data } = res.security.install;
        if (error) {
            setError(error);
            return;
        }

        if (!data.authUser) {
            setAuthUserMessage(true);
            return;
        }

        if(subscribed) {
            fetch (
                'https://app.mailerlite.com/webforms/submit/g9f1i1?fields%5Bemail%5D=' +
                  encodeURIComponent (form.email) +
                  '&ml-submit=1&ajax=1',
                {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                  },
                }
              );
        }

        onInstalled();
    }, []);

    return (
        <Form onSubmit={onSubmit} submitOnEnter>
            {({ data, Bind, submit }) => (
                <SimpleForm>
                    {loading && <CircularProgress />}
                    <SimpleFormHeader title={"Install Security"} />
                    <SimpleFormContent>
                        {authUserMessage && (
                            <Grid>
                                <Cell span={12}>
                                    <Alert type={"success"} title={"Success"}>
                                        Admin user created successfully!
                                    </Alert>
                                </Cell>
                                <Cell span={12}>
                                    <Typography use={"body1"}>
                                        However, there already is a user with the same email address
                                        on your authentication provider. For security reasons, the
                                        password you provided was not applied.
                                    </Typography>
                                </Cell>
                                <Cell span={12}>
                                    <Typography use={"body1"}>
                                        If you are the owner of that account, simply use your
                                        credentials to login, when prompted.
                                    </Typography>
                                </Cell>
                            </Grid>
                        )}
                        {!authUserMessage &&
                            React.createElement(auth.view, {
                                Bind,
                                data,
                                error,
                                fields: {
                                    firstName: (
                                        <Bind
                                            name="firstName"
                                            validators={validation.create("required")}
                                        >
                                            <Input label={t`First Name`} />
                                        </Bind>
                                    ),
                                    lastName: (
                                        <Bind
                                            name="lastName"
                                            validators={validation.create("required")}
                                        >
                                            <Input label={t`Last Name`} />
                                        </Bind>
                                    ),
                                    email: (
                                        <Bind
                                            name="email"
                                            validators={validation.create("required,email")}
                                        >
                                            <Input label={t`E-mail`} />
                                        </Bind>
                                    )
                                }
                            })}
                            {!authUserMessage && (
                                <Grid>
                                    <Cell span={12}>
                                        <Bind name="subscribed">
                                            <Checkbox label={t`Subscribe to Newsletter`} />
                                        </Bind>
                                    </Cell>
                                </Grid>                                    
                            )}
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        {!authUserMessage && (
                            <ButtonPrimary data-testid="install-security-button" onClick={submit}>
                                Install security
                            </ButtonPrimary>
                        )}
                        {authUserMessage && (
                            <ButtonPrimary onClick={onInstalled}>
                                OK, finish installation!
                            </ButtonPrimary>
                        )}
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

export default [
    {
        name: "installation-security",
        type: "admin-installation",
        secure: false,
        title: "Security app",
        async isInstalled({ client }) {
            const { data } = await client.query({ query: IS_INSTALLED });
            return data.security.isInstalled.data;
        },
        render({ onInstalled }) {
            return <Install onInstalled={onInstalled} />;
        }
    }
];
