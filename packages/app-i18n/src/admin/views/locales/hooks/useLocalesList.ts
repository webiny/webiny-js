import { useCallback, useState } from "react";
import orderBy from "lodash/orderBy";
import { i18n } from "@webiny/app/i18n";
import { useRouter } from "@webiny/react-router";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { useI18N } from "~/hooks/useI18N";
import { LIST_LOCALES, DELETE_LOCALE } from "./graphql";
import { useCurrentLocale } from "./useCurrentLocale";

const t = i18n.ns("app-i18n/admin/locales/data-list");

const serializeSorters = data => {
    if (!data) {
        return data;
    }
    const [[key, value]] = Object.entries(data);
    return `${key}:${value}`;
};

const deserializeSorters = (data: string): Record<string, "asc" | "desc" | boolean> => {
    if (typeof data !== "string") {
        return data;
    }

    const [key, value] = data.split(":") as [string, "asc" | "desc" | boolean];
    return {
        [key]: value
    };
};

interface Config {
    sorters: { label: string; sorters: Record<string, string> }[];
}

interface UseLocalesListHook {
    (config: Config): {
        loading: boolean;
        locales: Array<{
            code: string;
            default: boolean;
            createdOn: string;
            [key: string]: any;
        }>;
        currentLocaleCode: string;
        createLocale: () => void;
        filter: string;
        setFilter: (filter: string) => void;
        sort: string;
        setSort: (sort: string) => void;
        serializeSorters: (data: Record<string, string>) => string;
        editLocale: (code: string) => void;
        deleteLocale: (code: string) => void;
    };
}

export const useLocalesList: UseLocalesListHook = (config: Config) => {
    const defaultSorter = config.sorters.length ? config.sorters[0].sorters : null;
    const [filter, setFilter] = useState<string>("");
    const [sort, setSort] = useState<string>(serializeSorters(defaultSorter));
    const { refetchLocales, getDefaultLocale, getCurrentLocale, setCurrentLocale } = useI18N();
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const listQuery = useQuery(LIST_LOCALES);
    const currentLocaleCode = useCurrentLocale();
    const [deleteIt, deleteMutation] = useMutation(DELETE_LOCALE, {
        refetchQueries: [{ query: LIST_LOCALES }]
    });

    const { showConfirmation } = useConfirmationDialog();

    const filterLocales = useCallback(
        ({ code }) => {
            return code.toLowerCase().includes(filter);
        },
        [filter]
    );

    const sortLocaleList = useCallback(
        locales => {
            if (!sort) {
                return locales;
            }
            const [[key, value]] = Object.entries(deserializeSorters(sort));
            return orderBy(locales, [key], [value]);
        },
        [sort]
    );

    const data = listQuery.loading ? [] : listQuery.data.i18n.listI18NLocales.data;

    const deleteLocale = useCallback(
        item => {
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
                    setCurrentLocale(defaultLocale.code, "content");
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

    const editLocale = useCallback(code => {
        history.push(`/i18n/locales?code=${code}`);
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
        serializeSorters,
        editLocale,
        deleteLocale
    };
};
