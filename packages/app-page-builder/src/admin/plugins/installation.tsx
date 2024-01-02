import React, { useCallback, useState } from "react";
import gql from "graphql-tag";
import { useApolloClient } from "@apollo/react-hooks";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { Alert } from "@webiny/ui/Alert";
import { Cell, Grid } from "@webiny/ui/Grid";
import { ButtonPrimary } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { Input } from "@webiny/ui/Input";

import { validation } from "@webiny/validation";
import {
    SimpleForm,
    SimpleFormContent,
    SimpleFormFooter,
    SimpleFormHeader
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

interface PbInstallerProps {
    onInstalled: () => void;
}
const PBInstaller = ({ onInstalled }: PbInstallerProps) => {
    const client = useApolloClient();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const onSubmit = useCallback(async form => {
        setLoading(true);
        setError(null);

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
    }
};

export default adminInstallationPlugin;
