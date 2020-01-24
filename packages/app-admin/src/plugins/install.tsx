import React, { useState, useEffect } from "react";
import gql from "graphql-tag";
import { useApolloClient } from "react-apollo";
import { i18n } from "@webiny/app/i18n";
import { InstallationPlugin } from "@webiny/app-admin/types";
import { Alert } from "@webiny/ui/Alert";
import { CircularProgress } from "@webiny/ui/Progress";
import { SimpleForm, SimpleFormContent } from "@webiny/app-admin/components/SimpleForm";
import styled from "@emotion/styled";

const SimpleFormPlaceholder = styled.div({
    minHeight: 300,
    minWidth: 400
});

const t = i18n.ns("app-admin/admin/installation");

const IS_INSTALLED = gql`
    {
        files {
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
    mutation InstallFileManager($srcPrefix: String) {
        files {
            install(srcPrefix: $srcPrefix) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;

const FMInstaller = ({ onInstalled }) => {
    const client = useApolloClient();
    const [error, setError] = useState(null);

    useEffect(() => {
        client
            .mutate({
                mutation: INSTALL,
                variables: { srcPrefix: process.env.REACT_APP_API_URL + "/files" }
            })
            .then(({ data }) => {
                const { error } = data.files.install;
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
            <CircularProgress label={t`Installing File Manager...`} />
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
    name: "installation-fm",
    type: "installation",
    title: t`File Manager app`,
    dependencies: ["installation-security"],
    secure: true,
    async isInstalled({ client }) {
        const { data } = await client.query({ query: IS_INSTALLED });
        return data.files.isInstalled.data;
    },
    render({ onInstalled }) {
        return <FMInstaller onInstalled={onInstalled} />;
    }
};

export default plugin;
