import gql from "graphql-tag";
import React, { useCallback, useState } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import {
    Alert,
    Button,
    Checkbox,
    Grid,
    Heading,
    Input,
    OverlayLoader,
    Text
} from "@webiny/admin-ui";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import { View } from "@webiny/app/components/View";
import { AdminInstallationPlugin } from "@webiny/app-admin/types";

const IS_INSTALLED = gql`
    query IsAdminUsersInstalled {
        adminUsers {
            version
        }
    }
`;

const INSTALL = gql`
    mutation InstallAdminUsers($data: AdminUsersInstallInput) {
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

interface InstallCallableParams {
    subscribed: boolean;
    email: string;
    [key: string]: string | boolean;
}

interface InstallCallable {
    (data: InstallCallableParams): Promise<void>;
}

export interface InstallProps {
    onInstalled: () => void;
}

const Install = ({ onInstalled }: InstallProps) => {
    const client = useApolloClient();
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const onSubmit = useCallback<InstallCallable>(async ({ subscribed, ...form }) => {
        setLoading(true);
        setError(null);

        const { data: res } = await client.mutate({ mutation: INSTALL, variables: { data: form } });
        setLoading(false);
        const { error } = res.adminUsers.install;
        if (error) {
            switch (error.code) {
                case "COGNITO_ACCOUNT_EXISTS":
                    setError(`An account with this email already exists.`);
                    break;
                default:
                    setError(error.message);
            }

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
        <div className="wby-flex-1 wby-relative">
            {loading && <OverlayLoader />}
            <div className={"wby-container"}>
                <Form onSubmit={onSubmit} submitOnEnter>
                    {({ data, Bind, submit }) => (
                        <>
                            <div
                                style={{
                                    marginTop: 130
                                }}
                                className={"wby-text-center wby-mb-xxl"}
                            >
                                <Heading
                                    level={3}
                                    className={"wby-text-accent-primary wby-text-center wby-mb-sm"}
                                >
                                    {"Create admin account"}
                                </Heading>
                                <Text className={"wby-text-neutral-strong"}>
                                    {
                                        "To get things started, we need you to create Webiny Admin account. "
                                    }
                                </Text>
                            </div>
                            <div
                                className={"wby-mx-auto"}
                                style={{
                                    width: 480
                                }}
                            >
                                <Grid>
                                    <>
                                        {error && (
                                            <Grid.Column span={12}>
                                                <Alert
                                                    title={"Something went wrong"}
                                                    type={"danger"}
                                                >
                                                    {error}
                                                </Alert>
                                            </Grid.Column>
                                        )}
                                    </>
                                    <Grid.Column span={6}>
                                        <Bind
                                            name="firstName"
                                            validators={validation.create("required,minLength:2")}
                                        >
                                            <Input label={`First Name`} />
                                        </Bind>
                                    </Grid.Column>
                                    <Grid.Column span={6}>
                                        <Bind
                                            name="lastName"
                                            validators={validation.create("required,minLength:2")}
                                        >
                                            <Input label={`Last Name`} />
                                        </Bind>
                                    </Grid.Column>
                                    <Grid.Column span={12}>
                                        <Bind
                                            name="email"
                                            validators={validation.create("required,email")}
                                            beforeChange={(value: string, cb) =>
                                                cb(value.toLowerCase())
                                            }
                                        >
                                            <Input label={`Email`} />
                                        </Bind>
                                    </Grid.Column>
                                    <View
                                        name={"adminUsers.installation.fields"}
                                        props={{ Bind, data }}
                                    />
                                    <Grid.Column span={12}>
                                        <Bind name="subscribed">
                                            {({ value, onChange }) => (
                                                <Checkbox
                                                    checked={value}
                                                    onChange={onChange}
                                                    value={value}
                                                    label={
                                                        "I want to receive updates on product improvements and new features."
                                                    }
                                                />
                                            )}
                                        </Bind>
                                    </Grid.Column>
                                    <Grid.Column span={12} className={"wby-text-center"}>
                                        <Button
                                            size={"lg"}
                                            text={"Create account"}
                                            data-testid="install-security-button"
                                            onClick={() => {
                                                submit();
                                            }}
                                        />
                                    </Grid.Column>
                                    <Grid.Column span={6} offset={3} className={"wby-text-center"}>
                                        <Text size={"sm"}>
                                            By submitting the form, you agree to our Terms of
                                            Service and acknowledge our {privacyPolicyLink}.
                                        </Text>
                                    </Grid.Column>
                                </Grid>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </div>
    );
};

const installationPlugin: AdminInstallationPlugin = {
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
};

export default [installationPlugin];
