import React, { useState, useEffect, lazy } from "react";
import gql from "graphql-tag";
import { useApolloClient } from "@apollo/react-hooks";
import { i18n } from "@webiny/app/i18n";
import { Alert } from "@webiny/ui/Alert";
import { CircularProgress } from "@webiny/ui/Progress";
import { SimpleForm, SimpleFormContent } from "@webiny/app-admin/components/SimpleForm";
import styled from "@emotion/styled";
import { AdminInstallationPlugin } from "@webiny/app-admin/types";

const SimpleFormPlaceholder = styled.div({
    minHeight: 300,
    minWidth: 400
});

const t = i18n.ns("app-forms/admin/installation");

const IS_INSTALLED = gql`
    query IsFormBuilderInstalled {
        formBuilder {
            version
        }
    }
`;

const INSTALL = gql`
    mutation InstallFormBuilder($domain: String) {
        formBuilder {
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
        // Temporary fix for the ES index creation failure.
        // Let's try waiting a bit before running the installation.
        setTimeout(() => {
            client
                .mutate({
                    mutation: INSTALL,
                    variables: { domain: window.location.origin }
                })
                .then(({ data }) => {
                    const { error } = data.formBuilder.install;
                    if (error) {
                        setError(error.message);
                        return;
                    }

                    // Just so the user sees the actual message.
                    setTimeout(onInstalled, 3000);
                });
        }, 10000);
    }, []);

    const label = error ? (
        <Alert title={t`Something went wrong`} type={"danger"}>
            {error}
        </Alert>
    ) : (
        t`Installing Form Builder...`
    );

    return (
        <SimpleForm>
            <CircularProgress label={label} />
            <SimpleFormContent>
                <SimpleFormPlaceholder />
            </SimpleFormContent>
        </SimpleForm>
    );
};

const plugin: AdminInstallationPlugin = {
    name: "admin-installation-fb",
    type: "admin-installation",
    title: t`Form Builder`,
    dependencies: ["admin-installation-security"],
    secure: true,
    async getInstalledVersion({ client }) {
        const { data } = await client.query({ query: IS_INSTALLED });
        return data.formBuilder.version;
    },
    render({ onInstalled }) {
        return <FBInstaller onInstalled={onInstalled} />;
    },
    upgrades: [
        {
            version: "5.0.0",
            getComponent() {
                return lazy(() => import("./upgrades/v5.0.0"));
            }
        }
    ]
};

export default plugin;
