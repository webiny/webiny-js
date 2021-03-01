import React, { useCallback } from "react";
import styled from "@emotion/styled";
import isEmpty from "lodash/isEmpty";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ButtonDefault, ButtonIcon, ButtonPrimary } from "@webiny/ui/Button";
import { Switch } from "@webiny/ui/Switch";
import { CircularProgress } from "@webiny/ui/Progress";
import LocaleCodesAutoComplete from "./LocaleCodesAutoComplete";
import { useMutation, useQuery } from "@apollo/react-hooks";
import { useI18N } from "../../../hooks/useI18N";
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
import EmptyView from "@webiny/app-admin/components/EmptyView";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";

const t = i18n.ns("app-i18n/admin/locales/form");

const ButtonWrapper = styled("div")({
    display: "flex",
    justifyContent: "space-between"
});

const I18NLocaleForm = () => {
    const { refetchLocales } = useI18N();
    const { location, history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const newEntry = new URLSearchParams(location.search).get("new") === "true";
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
            // Reload page
            window.location.reload();
        },
        [code]
    );

    const data = getQuery?.data?.i18n?.getI18NLocale.data || {};

    const showEmptyView = !newEntry && !loading && isEmpty(data);
    // Render "No content" selected view.
    if (showEmptyView) {
        return (
            <EmptyView
                title={t`Click on the left side list to display locale details or create a...`}
                action={
                    <ButtonDefault
                        data-testid="new-record-button"
                        onClick={() => history.push("/i18n/locales?new=true")}
                    >
                        <ButtonIcon icon={<AddIcon />} /> {t`New Locale`}
                    </ButtonDefault>
                }
            />
        );
    }

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
                        <ButtonWrapper>
                            <ButtonDefault
                                onClick={() => history.push("/i18n/locales")}
                            >{t`Cancel`}</ButtonDefault>
                            <ButtonPrimary onClick={form.submit}>{t`Save locale`}</ButtonPrimary>
                        </ButtonWrapper>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

export default I18NLocaleForm;
