import { useCallback } from "react";
import { useMutation, useQuery } from "@apollo/react-hooks";
import isEmpty from "lodash/isEmpty";
import pick from "lodash/pick";
import omit from "lodash/omit";
import { i18n } from "@webiny/app/i18n";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useI18N } from "~/hooks/useI18N";
import { GET_LOCALE, CREATE_LOCALE, UPDATE_LOCALE, LIST_LOCALES } from "./graphql";
import { useCurrentLocale } from "./useCurrentLocale";
import { I18NLocaleItem } from "~/types";

const t = i18n.ns("app-i18n/admin/locales/form");

interface UseLocaleForm {
    loading: boolean;
    showEmptyView: boolean;
    createLocale: () => void;
    cancelEditing: () => void;
    locale: I18NLocaleItem;
    onSubmit: (item: I18NLocaleItem) => Promise<void>;
}
export const useLocaleForm = (): UseLocaleForm => {
    const { refetchLocales } = useI18N();
    const { location, history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const newEntry = new URLSearchParams(location.search).get("new") === "true";
    const currentLocaleCode = useCurrentLocale();
    const getQuery = useQuery(GET_LOCALE, {
        variables: { code: currentLocaleCode },
        skip: !currentLocaleCode,
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

    const loading = [getQuery, createMutation, updateMutation].some(item => item.loading);

    const onSubmit = useCallback(
        async (data: I18NLocaleItem) => {
            const isUpdate = data.createdOn;
            const [operation, args] = isUpdate
                ? [update, { variables: { code: data.code, data: pick(data, "default") } }]
                : [create, { variables: { data: omit(data, ["createdOn"]) } }];

            const response = await operation(args);

            const error = response?.data?.i18n?.locale?.error;
            if (error) {
                return showSnackbar(error.message);
            }

            !isUpdate && history.push(`/i18n/locales?code=${data.code}`);
            showSnackbar(t`Locale saved successfully.`);
            await refetchLocales();
            // Reload page
            window.location.reload();
        },
        [currentLocaleCode]
    );

    const locale = getQuery?.data?.i18n?.getI18NLocale.data || {};

    const showEmptyView = !newEntry && !loading && isEmpty(locale);
    const createLocale = useCallback(() => history.push("/i18n/locales?new=true"), []);
    const cancelEditing = useCallback(() => history.push("/i18n/locales"), []);

    return {
        loading,
        showEmptyView,
        createLocale,
        cancelEditing,
        locale,
        onSubmit
    };
};
