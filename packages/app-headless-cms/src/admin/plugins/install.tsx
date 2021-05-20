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

const t = i18n.ns("app-headless-cms/admin/installation");

const IS_INSTALLED = gql`
    query IsCMSInstalled {
        cms {
            version
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
                    data
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

    const label = error ? (
        <Alert title={t`Something went wrong`} type={"danger"}>
            {error}
        </Alert>
    ) : (
        t`Installing Headless CMS...`
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
    name: "admin-installation-cms",
    type: "admin-installation",
    title: t`Headless CMS`,
    dependencies: ["admin-installation-security", "admin-installation-i18n"],
    secure: true,
    async getInstalledVersion({ client }) {
        const { data } = await client.query({ query: IS_INSTALLED });
        return data.cms.version;
    },
    render({ onInstalled }) {
        return <CMSInstaller onInstalled={onInstalled} />;
    },
    upgrades: [
        {
            version: "5.0.0",
            getComponent() {
                return lazy(() => import("./upgrades/v5.0.0"));
            }
        },
        {
            version: "5.5.0",
            getComponent() {
                return lazy(() => import("./upgrades/v5.5.0"));
            }
        },
        {
            version: "5.8.0",
            getComponent() {
                return lazy(() => import("./upgrades/v5.8.0"));
            }
        }
    ]
};

export default plugin;
