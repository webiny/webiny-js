import React, { useState, useCallback } from "react";
import gql from "graphql-tag";
import { useApolloClient } from "react-apollo";
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

const t = i18n.ns("app-pb/admin/installation");

const IS_INSTALLED = gql`
    {
        pageBuilder {
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
    mutation InstallPageBuilder($step: Int!, $data: PbInstallInput!) {
        pageBuilder {
            install(step: $step, data: $data) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;

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
    const [installationStep, setInstallationStep] = useState(0);

    const onSubmit = useCallback(
        async form => {
            setLoading(true);
            setError(null);

            try {
                for (let step = 1; step <= 5; step++) {
                    setInstallationStep(step);
                    const response = await client.mutate({
                        mutation: INSTALL,
                        variables: { step: step, data: form }
                    });

                    const { error } = response.data.pageBuilder.install;
                    if (error) {
                        throw new Error(error.message);
                    }
                }
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }

            onInstalled();
        },
        [installationStep]
    );

    return (
        <Form onSubmit={onSubmit} data={{ domain: window.location.origin }}>
            {({ Bind, submit }) => (
                <SimpleForm>
                    {loading && <CircularProgress label={installationSteps[installationStep]} />}
                    {error && (
                        <Alert title={"Something went wrong"} type={"danger"}>
                            {error}
                        </Alert>
                    )}
                    <SimpleFormHeader title={"Install Page Builder"} />
                    <SimpleFormContent>
                        <Grid>
                            <Cell span={12}>
                                <Bind name="name" validators={validation.create("required")}>
                                    <Input
                                        label={t`Site Name`}
                                        description={`Name of your site, eg: "My Site"`}
                                    />
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <Bind name="domain" validators={validation.create("required,url")}>
                                    <Input
                                        label={t`Domain`}
                                        placeholder={"https://www.mysite.com"}
                                    />
                                </Bind>
                            </Cell>
                        </Grid>
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <ButtonPrimary onClick={submit}>{t`Install Page Builder`}</ButtonPrimary>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

export default {
    name: "installation-pb",
    type: "installation",
    title: "Page Builder app",
    dependencies: [],
    secure: true,
    async isInstalled({ client }) {
        const { data } = await client.query({ query: IS_INSTALLED });
        return data.pageBuilder.isInstalled.data;
    },
    render({ onInstalled }) {
        return <PBInstaller onInstalled={onInstalled} />;
    }
};
