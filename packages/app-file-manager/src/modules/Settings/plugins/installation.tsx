import React, { useState, useEffect } from "react";
import gql from "graphql-tag";
import { useApolloClient } from "@apollo/react-hooks";
import { i18n } from "@webiny/app/i18n";
import { AdminInstallationPlugin } from "@webiny/app-admin/types";
import { Alert } from "@webiny/ui/Alert";
import { CircularProgress } from "@webiny/ui/Progress";
import { SimpleForm, SimpleFormContent } from "@webiny/app-admin/components/SimpleForm";
import styled from "@emotion/styled";
import { config as appConfig } from "@webiny/app/config";

const SimpleFormPlaceholder = styled.div({
    minHeight: 300,
    minWidth: 400
});

const t = i18n.ns("app-file-manager/admin/installation");

const IS_INSTALLED = gql`
    query IsFileManagerInstalled {
        fileManager {
            version
        }
    }
`;

const INSTALL = gql`
    mutation InstallFileManager($srcPrefix: String) {
        fileManager {
            install(srcPrefix: $srcPrefix) {
                data
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;
interface FileManagerInstallerProps {
    onInstalled: () => Promise<void>;
}
const FMInstaller = ({ onInstalled }: FileManagerInstallerProps) => {
    const client = useApolloClient();
    const [error, setError] = useState(null);

    const apiUrl = appConfig.getKey("API_URL", process.env.REACT_APP_API_URL);

    useEffect(() => {
        client
            .mutate({
                mutation: INSTALL,
                variables: { srcPrefix: apiUrl + "/files" }
            })
            .then(({ data }) => {
                const { error } = data.fileManager.install;
                if (error) {
                    setError(error.message);
                    return;
                }

                // Just so the user sees the actual message.
                setTimeout(onInstalled, 3000);
            });
    }, []);

    const label = error ? (
        <Alert title={t`Something went wrong`} type={"danger"}>
            {error}
        </Alert>
    ) : (
        t`Installing File Manager...`
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
    name: "admin-installation-fm",
    type: "admin-installation",
    title: t`File Manager`,
    dependencies: [
        "admin-installation-security",
        "admin-installation-i18n",
        "admin-installation-cms"
    ],
    secure: true,
    async getInstalledVersion({ client }) {
        const { data } = await client.query({ query: IS_INSTALLED });
        return data.fileManager.version;
    },
    render({ onInstalled }) {
        return <FMInstaller onInstalled={onInstalled} />;
    }
};

export default plugin;
