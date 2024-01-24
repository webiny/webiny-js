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
    query IsTenancyInstalled {
        tenancy {
            version
        }
    }
`;

const INSTALL = gql`
    mutation InstallTenancy {
        tenancy {
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

interface TenancyInstallerProps {
    onInstalled: () => Promise<void>;
}
const TenancyInstaller = ({ onInstalled }: TenancyInstallerProps) => {
    const client = useApolloClient();
    const [error, setError] = useState(null);

    useEffect(() => {
        client.mutate({ mutation: INSTALL }).then(({ data }) => {
            const { error } = data.tenancy.install;
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
        `Installing Tenancy...`
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
    name: "admin-installation-tenancy",
    type: "admin-installation",
    title: `Tenancy`,
    dependencies: [],
    secure: false,
    async getInstalledVersion({ client }) {
        const { data } = await client.query({ query: IS_INSTALLED });
        return data.tenancy.version;
    },
    render({ onInstalled }) {
        return <TenancyInstaller onInstalled={onInstalled} />;
    }
};

export default plugin;
