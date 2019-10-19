import React, { useState, useCallback } from "react";
import { gql } from "apollo-server-lambda";
import { useApolloClient } from "react-apollo";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { Alert } from "@webiny/ui/Alert";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ButtonPrimary } from "@webiny/ui/Button";
import LocaleCodesAutoComplete from "@webiny/app-i18n/admin/views/I18NLocales/LocaleCodesAutoComplete";
import { CircularProgress } from "@webiny/ui/Progress";
import { validation } from "@webiny/validation";
import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";

const t = i18n.ns("app-i18n/admin/installation");

const IS_INSTALLED = gql`
    {
        i18n {
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
    mutation InstallSecurity($data: I18NInstallInput!) {
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

const I18NInstaller = ({ onInstalled }) => {
    const client = useApolloClient();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const onSubmit = useCallback(async form => {
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

    return (
        <Form onSubmit={onSubmit} data={{ code: "en-US" }}>
            {({ Bind, submit }) => (
                <SimpleForm>
                    {loading && <CircularProgress />}
                    {error && (
                        <Alert title={"Something went wrong"} type={"danger"}>
                            {error}
                        </Alert>
                    )}
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
                        <ButtonPrimary onClick={submit}>Install I18N</ButtonPrimary>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

export default {
    name: "install-i18n",
    type: "install",
    secure: true,
    async isInstalled({ client }) {
        const { data } = await client.query({ query: IS_INSTALLED });
        return data.i18n.isInstalled.data;
    },
    render({ onInstalled }) {
        return <I18NInstaller onInstalled={onInstalled} />;
    }
};
