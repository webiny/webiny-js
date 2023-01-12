import React, { useState, useCallback, lazy } from "react";
import gql from "graphql-tag";
import { useApolloClient } from "@apollo/react-hooks";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { Alert } from "@webiny/ui/Alert";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ButtonPrimary } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { Input } from "@webiny/ui/Input";

import { validation } from "@webiny/validation";
import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";
import { AdminInstallationPlugin } from "@webiny/app-admin/types";

const t = i18n.ns("api-page-builder/admin/installation");

const IS_INSTALLED = gql`
    query IsPageBuilderInstalled {
        pageBuilder {
            version
        }
    }
`;

const INSTALL = gql`
    mutation InstallPageBuilder($data: PbInstallInput!) {
        pageBuilder {
            install(data: $data) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;

// const installationSteps: Record<number, string> = {
//     1: t`Creating page categories...`,
//     2: t`Creating page blocks...`,
//     3: t`Creating pages...`,
//     4: t`Creating menus...`,
//     5: t`Finalizing...`
// };

interface PbInstallerProps {
    onInstalled: () => void;
}
const PBInstaller: React.FC<PbInstallerProps> = ({ onInstalled }) => {
    const client = useApolloClient();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const onSubmit = useCallback(async form => {
        setLoading(true);
        setError(null);
        setTimeout(async () => {
            // Temporary fix for the ES index creation failure.
            // Let's try waiting a bit before running the installation.
            const { data: res } = await client.mutate({
                mutation: INSTALL,
                variables: { data: form }
            });
            setLoading(false);
            const { error } = res.pageBuilder.install;
            if (error) {
                setError(error.message);
                return;
            }

            onInstalled();
        }, 10000);
    }, []);

    const label = error ? (
        <Alert title={t`Something went wrong`} type={"danger"}>
            {error}
        </Alert>
    ) : (
        t`Installing Page Builder...`
    );

    return (
        <Form onSubmit={onSubmit} submitOnEnter>
            {({ Bind, submit }) => (
                <SimpleForm>
                    {loading && <CircularProgress label={label} />}
                    <SimpleFormHeader title={t`Install Page Builder`} />
                    <SimpleFormContent>
                        <Grid>
                            <Cell span={12}>
                                <Bind name="name" validators={validation.create("required")}>
                                    <Input
                                        label={t`Site Name`}
                                        description={t`Name of your website, eg: "My Site"`}
                                    />
                                </Bind>
                            </Cell>
                        </Grid>
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <ButtonPrimary
                            data-testid="install-pb-button"
                            onClick={ev => {
                                submit(ev);
                            }}
                        >{t`Install Page Builder`}</ButtonPrimary>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

const adminInstallationPlugin: AdminInstallationPlugin = {
    name: "admin-installation-pb",
    type: "admin-installation",
    title: t`Page Builder`,
    dependencies: [
        "admin-installation-security",
        "admin-installation-i18n",
        "admin-installation-fm"
    ],
    secure: true,
    async getInstalledVersion({ client }) {
        const { data } = await client.query({ query: IS_INSTALLED });
        return data.pageBuilder.version;
    },
    render({ onInstalled }) {
        return <PBInstaller onInstalled={onInstalled} />;
    },
    upgrades: [
        {
            version: "5.0.0",
            getComponent() {
                return lazy(() => import("./upgrades/v5.0.0"));
            }
        },
        {
            version: "5.15.0",
            getComponent() {
                return lazy(() => import("./upgrades/v5.15.0"));
            }
        },
        {
            version: "5.34.0",
            getComponent() {
                return lazy(() => import("./upgrades/v5.34.0"));
            }
        }
    ]
};

export default adminInstallationPlugin;
