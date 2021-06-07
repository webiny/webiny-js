import gql from "graphql-tag";
import React, { useState, useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { Form } from "@webiny/form";
import { i18n } from "@webiny/app/i18n";
import { Alert } from "@webiny/ui/Alert";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Input } from "@webiny/ui/Input";
import { Checkbox } from "@webiny/ui/Checkbox";
import { Grid, Cell } from "@webiny/ui/Grid";
import { CircularProgress } from "@webiny/ui/Progress";
import { validation } from "@webiny/validation";
import { plugins } from "@webiny/plugins";
import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";
import { SecurityInstallationFormPlugin } from "../types";

const t = i18n.ns("app-security/admin/installation");

const IS_INSTALLED = gql`
    query IsSecurityInstalled {
        security {
            version
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
    const uiPlugins = plugins.byType<SecurityInstallationFormPlugin>("security-installation-form");

    const client = useApolloClient();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const onSubmit = useCallback(async ({ subscribed, ...form }) => {
        setLoading(true);
        setError(null);

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
                        <Grid>
                            {error && (
                                <Cell span={12}>
                                    <Alert title={"Something went wrong"} type={"danger"}>
                                        {error.message}
                                    </Alert>
                                </Cell>
                            )}
                            <Cell span={12}>Let&apos;s create your admin user:</Cell>
                            <Cell span={12}>
                                <Bind
                                    name="firstName"
                                    validators={validation.create("required,minLength:2")}
                                >
                                    <Input label={t`First Name`} />
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <Bind
                                    name="lastName"
                                    validators={validation.create("required,minLength:2")}
                                >
                                    <Input label={t`Last Name`} />
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <Bind
                                    name="login"
                                    validators={validation.create("required,email")}
                                    beforeChange={(value: string, cb) => cb(value.toLowerCase())}
                                >
                                    <Input label={t`E-mail`} />
                                </Bind>
                            </Cell>
                            {uiPlugins.map(pl => (
                                <React.Fragment key={pl.name}>
                                    {pl.render({ Bind, data })}
                                </React.Fragment>
                            ))}
                        </Grid>

                        <Grid>
                            <Cell span={12}>
                                <Bind name="subscribed">
                                    <Checkbox
                                        label={
                                            <span>
                                                I want to receive updates on product improvements
                                                and new features. Doing so I accept Webiny&apos;s{" "}
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
        name: "admin-installation-security",
        type: "admin-installation",
        secure: false,
        title: "Security",
        async getInstalledVersion({ client }) {
            const { data } = await client.query({ query: IS_INSTALLED });
            return data.security.version;
        },
        render({ onInstalled }) {
            return <Install onInstalled={onInstalled} />;
        }
    }
];
