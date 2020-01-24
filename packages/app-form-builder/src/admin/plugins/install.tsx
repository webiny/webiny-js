import React, { useState, useEffect } from "react";
import gql from "graphql-tag";
import { useApolloClient } from "react-apollo";
import { i18n } from "@webiny/app/i18n";
import { Alert } from "@webiny/ui/Alert";
import { CircularProgress } from "@webiny/ui/Progress";
import { SimpleForm, SimpleFormContent } from "@webiny/app-admin/components/SimpleForm";
import styled from "@emotion/styled";
import { InstallationPlugin } from "@webiny/app-admin/types";

const SimpleFormPlaceholder = styled.div({
    minHeight: 300,
    minWidth: 400
});

const t = i18n.ns("app-forms/admin/installation");

const IS_INSTALLED = gql`
    {
        forms {
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
    mutation InstallFormBuilder($domain: String) {
        forms {
            install(domain: $domain) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;

const FBInstaller = ({ onInstalled }) => {
    const client = useApolloClient();
    const [error, setError] = useState(null);

    useEffect(() => {
        client
            .mutate({
                mutation: INSTALL,
                variables: { domain: window.location.origin }
            })
            .then(({ data }) => {
                const { error } = data.forms.install;
                if (error) {
                    setError(error.message);
                    return;
                }

                // Just so the user sees the actual message.
                setTimeout(onInstalled, 3000);
            });
    }, []);

    return (
        <SimpleForm>
            <CircularProgress label={t`Installing Form Builder...`} />
            {error && (
                <Alert title={t`Something went wrong`} type={"danger"}>
                    {error}
                </Alert>
            )}
            <SimpleFormContent>
                <SimpleFormPlaceholder />
            </SimpleFormContent>
        </SimpleForm>
    );
};

const plugin: InstallationPlugin = {
    name: "installation-fb",
    type: "installation",
    title: t`Form Builder app`,
    dependencies: ["installation-security"],
    secure: true,
    async isInstalled({ client }) {
        const { data } = await client.query({ query: IS_INSTALLED });
        return data.forms.isInstalled.data;
    },
    render({ onInstalled }) {
        return <FBInstaller onInstalled={onInstalled} />;
    }
};

export default plugin;