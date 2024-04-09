import React, { useState, useCallback } from "react";
import gql from "graphql-tag";
import { useApolloClient } from "@apollo/react-hooks";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { Alert } from "@webiny/ui/Alert";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ButtonPrimary } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { validation } from "@webiny/validation";
import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";
import LocaleCodesAutoComplete from "../components/LocaleCodesAutoComplete";
import { AdminInstallationPlugin } from "@webiny/app-admin/types";

const t = i18n.ns("app-i18n/admin/installation");

const IS_INSTALLED = gql`
    query IsI18NInstalled {
        i18n {
            version
        }
    }
`;

const INSTALL = gql`
    mutation InstallI18N($data: I18NInstallInput!) {
        i18n {
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

interface I18NInstallerProps {
    onInstalled: () => void;
}
const I18NInstaller = ({ onInstalled }: I18NInstallerProps) => {
    const client = useApolloClient();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const onSubmit = useCallback(async (form: Record<string, string>): Promise<void> => {
        setLoading(true);
        setError(null);
        const { data: res } = await client.mutate({ mutation: INSTALL, variables: { data: form } });
        setLoading(false);
        const { error } = res.i18n.install;
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
        t`Installing I18N...`
    );

    return (
        <Form onSubmit={onSubmit} data={{ code: "en-US" }}>
            {({ Bind, submit }) => (
                <SimpleForm>
                    {loading && <CircularProgress label={label} />}
                    <SimpleFormHeader title={"Install I18N"} />
                    <SimpleFormContent>
                        <Grid>
                            <Cell span={12}>
                                <Bind name="code" validators={validation.create("required")}>
                                    <LocaleCodesAutoComplete label={t`Select default locale`} />
                                </Bind>
                            </Cell>
                        </Grid>
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <ButtonPrimary
                            data-testid="install-i18n-button"
                            onClick={ev => {
                                submit(ev);
                            }}
                        >
                            Install I18N
                        </ButtonPrimary>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

const installationPlugin: AdminInstallationPlugin = {
    name: "admin-installation-i18n",
    type: "admin-installation",
    title: "I18N",
    dependencies: ["admin-installation-security"],
    secure: true,
    async getInstalledVersion({ client }) {
        const { data } = await client.query({ query: IS_INSTALLED });
        return data.i18n.version;
    },
    render({ onInstalled }) {
        return <I18NInstaller onInstalled={onInstalled} />;
    }
};

export default installationPlugin;
