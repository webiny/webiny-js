import { gql } from "apollo-server-lambda";
import React, { useState, useCallback } from "react";
import { useApolloClient } from "react-apollo";
import { Form } from "@webiny/form";
import { i18n } from "@webiny/app/i18n";
import { Alert } from "@webiny/ui/Alert";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Input } from "@webiny/ui/Input";
import { CircularProgress } from "@webiny/ui/Progress";
import { validation } from "@webiny/validation";
import { getPlugins } from "@webiny/plugins";
import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";

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
    const auth = getPlugins("security-authentication-provider")
        .filter(pl => pl.hasOwnProperty("renderInstallForm"))
        .pop();

    if (!auth) {
        throw Error(`You must register a "security-authentication-provider" plugin!`);
    }

    const { renderInstallForm } = auth;

    const client = useApolloClient();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const onSubmit = useCallback(async form => {
        setLoading(true);
        setError(null);
        const { data: res } = await client.mutate({ mutation: INSTALL, variables: { data: form } });
        setLoading(false);
        const { error } = res.security.install;
        if (error) {
            setError(error.message);
            return;
        }

        onInstalled();
    }, []);

    return (
        <Form onSubmit={onSubmit}>
            {({ data, Bind, submit }) => (
                <SimpleForm>
                    {loading && <CircularProgress />}
                    {error && (
                        <Alert title={"Something went wrong"} type={"danger"}>
                            {error}
                        </Alert>
                    )}
                    <SimpleFormHeader title={"Install Security"} />
                    <SimpleFormContent>
                        {renderInstallForm({
                            Bind,
                            data,
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
                                        <Input label={t`Last name`} />
                                    </Bind>
                                ),
                                email: (
                                    <Bind name="email" validators={validation.create("required")}>
                                        <Input label={t`E-mail`} />
                                    </Bind>
                                )
                            }
                        })}
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <ButtonPrimary onClick={submit}>Install security</ButtonPrimary>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

export default [
    {
        name: "install-security",
        type: "install",
        secure: false,
        async isInstalled({ client }) {
            const { data } = await client.query({ query: IS_INSTALLED });
            return data.security.isInstalled.data;
        },
        render({ onInstalled }) {
            return <Install onInstalled={onInstalled} />;
        }
    }
];
