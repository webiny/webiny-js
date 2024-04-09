import React, { useEffect, useState } from "react";
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

interface FBInstallerProps {
    onInstalled: () => void;
}
const FBInstaller = ({ onInstalled }: FBInstallerProps) => {
    const client = useApolloClient();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
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

                onInstalled();
            });
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
    dependencies: [
        "admin-installation-security",
        "admin-installation-i18n",
        "admin-installation-fm"
    ],
    secure: true,
    async getInstalledVersion({ client }) {
        const { data } = await client.query({ query: IS_INSTALLED });
        return data.formBuilder.version;
    },
    render({ onInstalled }) {
        return <FBInstaller onInstalled={onInstalled} />;
    }
};

export default plugin;
