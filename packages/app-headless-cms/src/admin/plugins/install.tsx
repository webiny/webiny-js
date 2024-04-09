import React, { useEffect, useState } from "react";
import gql from "graphql-tag";
import { useApolloClient } from "@apollo/react-hooks";
import { i18n } from "@webiny/app/i18n";
import { Alert } from "@webiny/ui/Alert";
import { CircularProgress } from "@webiny/ui/Progress";
import { SimpleForm, SimpleFormContent } from "@webiny/app-admin/components/SimpleForm";
import styled from "@emotion/styled";
import { AdminInstallationPlugin } from "@webiny/app-admin/types";
import { CmsErrorResponse } from "~/types";

const SimpleFormPlaceholder = styled.div({
    minHeight: 300,
    minWidth: 400
});

const t = i18n.ns("app-headless-cms/admin/installation");
/**
 * ########################
 * Is Installed Query
 */
export interface CmsIsInstalledQueryResponse {
    cms: {
        version: string | null;
    };
}
const IS_INSTALLED = gql`
    query IsCMSInstalled {
        cms {
            version
        }
    }
`;
/**
 * ########################
 * Install Mutation
 */
export interface CmsInstallMutationResponse {
    cms: {
        install: {
            data: boolean;
            error?: CmsErrorResponse;
        };
    };
}
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
interface CMSInstallerProps {
    onInstalled: () => void;
}
const CMSInstaller = ({ onInstalled }: CMSInstallerProps) => {
    const client = useApolloClient();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        client
            .mutate<CmsInstallMutationResponse>({
                mutation: INSTALL
            })
            .then(result => {
                if (!result || !result.data) {
                    setError("Missing Install Mutation response data.");
                    return;
                }
                const { error } = result.data.cms.install;
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
        const { data } = await client.query<CmsIsInstalledQueryResponse>({ query: IS_INSTALLED });
        return data.cms.version;
    },
    render({ onInstalled }) {
        return <CMSInstaller onInstalled={onInstalled} />;
    }
};

export default plugin;
