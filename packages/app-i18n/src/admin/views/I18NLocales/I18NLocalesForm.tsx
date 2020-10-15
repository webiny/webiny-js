import React, { useCallback } from "react";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Switch } from "@webiny/ui/Switch";
import { CircularProgress } from "@webiny/ui/Progress";
import LocaleCodesAutoComplete from "./LocaleCodesAutoComplete";
import { useMutation, useQuery } from "react-apollo";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import { validation } from "@webiny/validation";
import { GET_LOCALE, CREATE_LOCALE, UPDATE_LOCALE, LIST_LOCALES } from "./graphql";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";

const t = i18n.ns("app-i18n/admin/locales/form");

const I18NLocaleForm = () => {
    const { refetchLocales } = useI18N();
    const { location, history } = useRouter();
    const { showSnackbar } = useSnackbar();

    const code = new URLSearchParams(location.search).get("code");

    const getQuery = useQuery(GET_LOCALE, {
        variables: { code },
        skip: !code,
        onCompleted: data => {
            const error = data?.i18n?.getI18NLocale?.error;
            if (error) {
                history.push("/i18n/locales");
                showSnackbar(error.message);
            }
        }
    });

    const [create, createMutation] = useMutation(CREATE_LOCALE, {
        refetchQueries: [{ query: LIST_LOCALES }]
    });

    const [update, updateMutation] = useMutation(UPDATE_LOCALE, {
        refetchQueries: [{ query: LIST_LOCALES }]
    });

    const loading = [getQuery, createMutation, updateMutation].find(item => item.loading);

    const onSubmit = useCallback(
        async data => {
            const isUpdate = data.createdOn;
            const [operation, args] = isUpdate
                ? [update, { variables: { code: data.code, data } }]
                : [create, { variables: { data } }];

            const response = await operation(args);

            const error = response?.data?.i18n?.locale?.error;
            if (error) {
                return showSnackbar(error.message);
            }

            !isUpdate && history.push(`/i18n/locales?code=${data.code}`);
            showSnackbar(t`Locale saved successfully.`);
            refetchLocales();
        },
        [code]
    );

    const data = getQuery?.data?.i18n?.getI18NLocale.data || {};
    return (
        <Form data={data} onSubmit={onSubmit}>
            {({ data, form, Bind }) => (
                <SimpleForm>
                    {loading && <CircularProgress />}
                    <SimpleFormHeader title={data.code || t`New locale`} />
                    <SimpleFormContent>
                        <Grid>
                            <Cell span={12}>
                                <Bind name="code" validators={validation.create("required")}>
                                    <LocaleCodesAutoComplete
                                        disabled={data.createdOn}
                                        label={t`Code`}
                                        description={t`For example: "en-GB"`}
                                    />
                                </Bind>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <Bind name="default">
                                    <Switch label={t`Default`} />
                                </Bind>
                            </Cell>
                        </Grid>
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <ButtonPrimary onClick={form.submit}>{t`Save locale`}</ButtonPrimary>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

export default I18NLocaleForm;
