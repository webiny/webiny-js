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

const t = i18n.ns("app-headless-cms/admin/installation");

const IS_INSTALLED = gql`
    {
        cms {
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
    mutation InstallCms {
        cms {
            install {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;

const CMSInstaller = ({ onInstalled }) => {
    const client = useApolloClient();
    const [error, setError] = useState(null);

    useEffect(() => {
        client
            .mutate({
                mutation: INSTALL
            })
            .then(({ data }) => {
                const { error } = data.cms.install;
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
            <CircularProgress label={t`Installing CMS...`} />
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
    name: "installation-cms",
    type: "installation",
    title: t`Headless CMS`,
    dependencies: [],
    secure: true,
    async isInstalled({ client }) {
        const { data } = await client.query({ query: IS_INSTALLED });
        return data.cms.isInstalled.data;
    },
    render({ onInstalled }) {
        return <CMSInstaller onInstalled={onInstalled} />;
    }
};

export default plugin;
