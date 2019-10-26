import React, { useState, useCallback } from "react";
import gql from "graphql-tag";
import { useApolloClient } from "react-apollo";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { Alert } from "@webiny/ui/Alert";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ButtonPrimary } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";

import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";

const t = i18n.ns("app-admin/files/installation");

const IS_INSTALLED = gql`
    {
        files {
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
    mutation InstallFiles($data: FilesInstallInput!) {
        files {
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

const FilesInstaller = ({ onInstalled }) => {
    const client = useApolloClient();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const submit = useCallback(async form => {
        setLoading(true);
        setError(null);
        const { data: res } = await client.mutate({ mutation: INSTALL, variables: { data: form } });
        setLoading(false);
        const { error } = res.files.install;
        if (error) {
            setError(error.message);
            return;
        }

        onInstalled();
    }, []);

    return (
        <SimpleForm>
            {loading && <CircularProgress />}
            {error && (
                <Alert title={"Something went wrong"} type={"danger"}>
                    {error}
                </Alert>
            )}
            <SimpleFormHeader title={"Install Files"} />
            <SimpleFormContent>
                <Grid>
                    <Cell>{t`Click next to install.`}</Cell>
                </Grid>
            </SimpleFormContent>
            <SimpleFormFooter>
                <ButtonPrimary onClick={submit}>{t`Next`}</ButtonPrimary>
            </SimpleFormFooter>
        </SimpleForm>
    );
};

export default {
    name: "install-files",
    type: "install",
    title: "Files app",
    dependencies: ["install-files"],
    secure: true,
    async isInstalled({ client }) {
        const { data } = await client.query({ query: IS_INSTALLED });
        return data.files.isInstalled.data;
    },
    render({ onInstalled }) {
        return <FilesInstaller onInstalled={onInstalled} />;
    }
};
