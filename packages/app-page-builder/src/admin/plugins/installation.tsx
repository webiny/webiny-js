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

// eslint-disable-next-line
const installationSteps = {
    1: t`Creating page categories...`,
    2: t`Creating page blocks...`,
    3: t`Creating pages...`,
    4: t`Creating menus...`,
    5: t`Finalizing...`
};

const PBInstaller = ({ onInstalled }) => {
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
                            onClick={submit}
                        >{t`Install Page Builder`}</ButtonPrimary>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

export default {
    name: "admin-installation-pb",
    type: "admin-installation",
    title: t`Page Builder`,
    dependencies: [],
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
        }
    ]
};
