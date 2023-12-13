import React, { useState, useEffect } from "react";
import gql from "graphql-tag";
import { useApolloClient } from "@apollo/react-hooks";
import { Alert } from "@webiny/ui/Alert";
import { CircularProgress } from "@webiny/ui/Progress";
import { SimpleForm, SimpleFormContent } from "@webiny/app-admin/components/SimpleForm";
import styled from "@emotion/styled";
import { AdminInstallationPlugin } from "@webiny/app-admin/types";

const SimpleFormPlaceholder = styled.div({
    minHeight: 300,
    minWidth: 400
});

const IS_INSTALLED = gql`
    query IsSecurityInstalled {
        security {
            version
        }
    }
`;

const INSTALL = gql`
    mutation InstallSecurity {
        security {
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

interface SecurityInstallerProps {
    onInstalled: () => void;
}
const SecurityInstaller = ({ onInstalled }: SecurityInstallerProps) => {
    const client = useApolloClient();
    const [error, setError] = useState(null);

    useEffect(() => {
        client.mutate({ mutation: INSTALL }).then(({ data }) => {
            const { error } = data.security.install;
            if (error) {
                setError(error.message);
                return;
            }

            // Just so the user sees the actual message.
            setTimeout(onInstalled, 3000);
        });
    }, []);

    const label = error ? (
        <Alert title={`Something went wrong`} type={"danger"}>
            {error}
        </Alert>
    ) : (
        `Installing Security...`
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
    name: "admin-installation-security",
    type: "admin-installation",
    title: `Security`,
    dependencies: [`admin-installation-tenancy`],
    secure: false,
    async getInstalledVersion({ client }) {
        const { data } = await client.query({ query: IS_INSTALLED });
        return data.security.version;
    },
    render({ onInstalled }) {
        return <SecurityInstaller onInstalled={onInstalled} />;
    }
};

export default plugin;
