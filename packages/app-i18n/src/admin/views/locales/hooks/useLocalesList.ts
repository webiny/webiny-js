import { useCallback, useState } from "react";
import orderBy from "lodash/orderBy";
import { i18n } from "@webiny/app/i18n";
import { useRouter } from "@webiny/react-router";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { useI18N } from "~/hooks/useI18N";
import { LIST_LOCALES, DELETE_LOCALE, ListI18NLocalesResponse } from "./graphql";
import { useCurrentLocale } from "./useCurrentLocale";
import { I18NLocaleItem } from "~/types";

const t = i18n.ns("app-i18n/admin/locales/data-list");

type SortTypes = "asc" | "desc";
export const deserializeSorters = (data: string): [string, SortTypes] => {
    if (typeof data !== "string") {
        return data;
    }
    const [field, orderBy] = data.split("_") as [string, SortTypes];
    const order = String(orderBy).toLowerCase() === "asc" ? "asc" : "desc";
    return [field, order];
};

interface Sorter {
    label: string;
    sorter: string;
}

interface Config {
    sorters: Sorter[];
}

interface UseLocalesListHook {
    (config: Config): {
        loading: boolean;
        locales: I18NLocaleItem[];
        currentLocaleCode: string | null;
        createLocale: () => void;
        filter: string;
        setFilter: (filter: string) => void;
        sort: string | null;
        setSort: (sort: string) => void;
        editLocale: (code: I18NLocaleItem) => void;
        deleteLocale: (code: I18NLocaleItem) => void;
    };
}

export const useLocalesList: UseLocalesListHook = (config: Config) => {
    const defaultSorter = config.sorters.length ? config.sorters[0].sorter : null;
    const [filter, setFilter] = useState<string>("");
    const [sort, setSort] = useState<string | null>(defaultSorter);
    const { refetchLocales, getDefaultLocale, getCurrentLocale, setCurrentLocale } = useI18N();
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const listQuery = useQuery<ListI18NLocalesResponse>(LIST_LOCALES);
    const currentLocaleCode = useCurrentLocale();
    const [deleteIt, deleteMutation] = useMutation(DELETE_LOCALE, {
        refetchQueries: [{ query: LIST_LOCALES }]
    });

    const { showConfirmation } = useConfirmationDialog({
        dataTestId: "default-data-list.delete-dialog"
    });

    const filterLocales = useCallback(
        ({ code }: I18NLocaleItem) => {
            return code.toLowerCase().includes(filter);
        },
        [filter]
    );

    const sortLocaleList = useCallback(
        (locales: I18NLocaleItem[]) => {
            if (!sort) {
                return locales;
            }
            const [key, value] = deserializeSorters(sort);
            return orderBy(locales, [key], [value]);
        },
        [sort]
    );

    const data = listQuery.loading ? [] : listQuery.data?.i18n.listI18NLocales.data || [];

    const deleteLocale = useCallback(
        (item: I18NLocaleItem) => {
            showConfirmation(async () => {
                const response = await deleteIt({
                    variables: item
                });

                const { error } = response.data.i18n.deleteI18NLocale;
                if (error) {
                    return showSnackbar(error.message);
                }

                showSnackbar(t`Locale "{code}" deleted.`({ code: item.code }));

                if (getCurrentLocale("content") === item.code) {
                    // Update current "content" locale
                    const defaultLocale = getDefaultLocale();
                    if (defaultLocale) {
                        setCurrentLocale(defaultLocale.code, "content");
                    }
                }

                if (currentLocaleCode === item.code) {
                    history.push(`/i18n/locales`);
                }

                refetchLocales();
                // Reload page
                window.location.reload();
            });
        },
        [currentLocaleCode]
    );

    const loading = [listQuery, deleteMutation].some(item => item.loading);
    const filteredData = filter === "" ? data : data.filter(filterLocales);
    const locales = sortLocaleList(filteredData);

    const createLocale = useCallback(() => history.push("/i18n/locales?new=true"), []);

    const editLocale = useCallback((item: I18NLocaleItem) => {
        history.push(`/i18n/locales?code=${item.code}`);
    }, []);

    return {
        locales,
        loading,
        currentLocaleCode,
        createLocale,
        filter,
        setFilter,
        sort,
        setSort,
        editLocale,
        deleteLocale
    };
};
