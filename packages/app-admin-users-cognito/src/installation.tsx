import gql from "graphql-tag";
import React, { useState, useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { Form } from "@webiny/form";
import { Alert } from "@webiny/ui/Alert";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Input } from "@webiny/ui/Input";
import { Checkbox } from "@webiny/ui/Checkbox";
import { Grid, Cell } from "@webiny/ui/Grid";
import { CircularProgress } from "@webiny/ui/Progress";
import { validation } from "@webiny/validation";
import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";
import { View } from "@webiny/app/components/View";

const IS_INSTALLED = gql`
    query IsAdminUsersInstalled {
        adminUsers {
            version
        }
    }
`;

const INSTALL = gql`
    mutation InstallAdminUsers($data: AdminUsersInstallInput!) {
        adminUsers {
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
    const client = useApolloClient();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const onSubmit = useCallback(async ({ subscribed, ...form }) => {
        setLoading(true);
        setError(null);

        const { data: res } = await client.mutate({ mutation: INSTALL, variables: { data: form } });
        setLoading(false);
        const { error } = res.adminUsers.install;
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
                    <SimpleFormHeader title={"Create an Admin User"} />
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
                                    <Input label={`First Name`} />
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <Bind
                                    name="lastName"
                                    validators={validation.create("required,minLength:2")}
                                >
                                    <Input label={`Last Name`} />
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <Bind
                                    name="email"
                                    validators={validation.create("required,email")}
                                    beforeChange={(value: string, cb) => cb(value.toLowerCase())}
                                >
                                    <Input label={`Email`} />
                                </Bind>
                            </Cell>
                            <View name={"adminUsers.installation.fields"} props={{ Bind, data }} />
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
                            Create Admin User
                        </ButtonPrimary>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

export default [
    {
        name: "admin-installation-admin-users",
        type: "admin-installation",
        dependencies: ["admin-installation-security"],
        secure: false,
        title: "Admin User",
        async getInstalledVersion({ client }) {
            const { data } = await client.query({ query: IS_INSTALLED });
            return data.adminUsers.version;
        },
        render({ onInstalled }) {
            return <Install onInstalled={onInstalled} />;
        }
    }
];
