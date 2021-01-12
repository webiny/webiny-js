import React, { useCallback, useState } from "react";
import { i18n } from "@webiny/app/i18n";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { useRouter } from "@webiny/react-router";
import { useQuery, useMutation } from "react-apollo";
import { LIST_LOCALES, DELETE_LOCALE } from "./graphql";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import orderBy from "lodash/orderBy";
import {
    DataList,
    ScrollList,
    ListItem,
    ListItemText,
    ListItemMeta,
    ListActions,
    ListItemTextSecondary
} from "@webiny/ui/List";

import { DeleteIcon } from "@webiny/ui/List/DataList/icons";
import { ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import SearchUI from "@webiny/app-admin/components/SearchUI";
import { ReactComponent as AddIcon } from "../../assets/icons/add-18px.svg";

const t = i18n.ns("app-i18n/admin/locales/data-list");

const SORTERS = [
    {
        label: t`Code A-Z`,
        sorters: { code: "asc" }
    },
    {
        label: t`Code Z-A`,
        sorters: { code: "desc" }
    }
];

const I18NLocalesDataList = () => {
    const [filter, setFilter] = useState("");
    const [sort, setSort] = useState(null);
    const { refetchLocales } = useI18N();
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const listQuery = useQuery(LIST_LOCALES);
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
            const [[key, value]] = Object.entries(sort);
            return orderBy(locales, [key], [value]);
        },
        [sort]
    );

    const data = listQuery.loading ? [] : listQuery.data.i18n.listI18NLocales.data;
    const code = new URLSearchParams(location.search).get("code");

    const deleteItem = useCallback(
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

                if (code === item.code) {
                    history.push(`/i18n/locales`);
                }

                refetchLocales();
            });
        },
        [code]
    );

    const loading = [listQuery, deleteMutation].find(item => item.loading);

    const filteredData = filter === "" ? data : data.filter(filterLocales);
    const localeList = sortLocaleList(filteredData);

    return (
        <DataList
            loading={Boolean(loading)}
            actions={
                <ButtonSecondary
                    data-testid="new-record-button"
                    onClick={() => history.push("/i18n/locales?new=true")}
                >
                    <ButtonIcon icon={<AddIcon />} /> {t`Add Locale`}
                </ButtonSecondary>
            }
            data={localeList}
            title={t`Locales`}
            refresh={listQuery.refetch}
            search={
                <SearchUI
                    value={filter}
                    onChange={setFilter}
                    inputPlaceholder={t`Search locales`}
                />
            }
            sorters={SORTERS}
            setSorters={sorter => setSort(sorter)}
        >
            {({ data }) => (
                <ScrollList>
                    {data.map(item => (
                        <ListItem key={item.code} selected={item.code === code}>
                            <ListItemText
                                onClick={() => history.push(`/i18n/locales?code=${item.code}`)}
                            >
                                {item.code}
                                <ListItemTextSecondary>
                                    {item.default && t`Default locale`}
                                </ListItemTextSecondary>
                            </ListItemText>

                            <ListItemMeta>
                                <ListActions>
                                    <DeleteIcon onClick={() => deleteItem(item)} />
                                </ListActions>
                            </ListItemMeta>
                        </ListItem>
                    ))}
                </ScrollList>
            )}
        </DataList>
    );
};

export default I18NLocalesDataList;
