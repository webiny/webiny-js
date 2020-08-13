import gql from "graphql-tag";
import React, { useState, useCallback } from "react";
import { useApolloClient } from "react-apollo";
import { Form } from "@webiny/form";
import { i18n } from "@webiny/app/i18n";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Input } from "@webiny/ui/Input";
import { Checkbox } from "@webiny/ui/Checkbox";
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
                data
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
    const [error, setError] = useState(null);

    const onSubmit = useCallback(async ({ subscribed, ...form }) => {
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
        const { error } = res.security.install;
        if (error) {
            setError(error);
            return;
        }

        if (subscribed) {
            try {
                await fetch(
                    "https://app.mailerlite.com/webforms/submit/g9f1i1?fields%5Bemail%5D=" +
                        encodeURIComponent(form.email) +
                        "&ml-submit=1&ajax=1",
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded"
                        }
                    }
                );
            } catch (err) {
                setError("Unable to subscribe you to the newsletter " + err);
            }
        }

        onInstalled();
    }, []);

    const privacyPolicyLink = <a href="https://www.webiny.com/privacy-policy">privacy policy</a>;

    return (
        <Form onSubmit={onSubmit} submitOnEnter>
            {({ data, Bind, submit }) => (
                <SimpleForm>
                    {loading && <CircularProgress />}
                    <SimpleFormHeader title={"Install Security"} />
                    <SimpleFormContent>
                        {React.createElement(auth.view, {
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
                        <Grid>
                            <Cell span={12}>
                                <Bind name="subscribed">
                                    <Checkbox
                                        label={
                                            <span>
                                                I want to receive updates on product improvements
                                                and new features. Doing so I accept Webiny's{" "}
                                                {privacyPolicyLink}.
                                            </span>
                                        }
                                    />
                                </Bind>
                            </Cell>
                        </Grid>
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <ButtonPrimary data-testid="install-security-button" onClick={submit}>
                            Install security
                        </ButtonPrimary>
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
        title: "User Management",
        async isInstalled({ client }) {
            const { data } = await client.query({ query: IS_INSTALLED });
            return data.security.isInstalled.data;
        },
        render({ onInstalled }) {
            return <Install onInstalled={onInstalled} />;
        }
    }
];
