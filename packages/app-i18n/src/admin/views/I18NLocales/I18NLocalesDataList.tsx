import React, { useCallback, useMemo, useState } from "react";
import { i18n } from "@webiny/app/i18n";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { useRouter } from "@webiny/react-router";
import { useQuery, useMutation } from "@apollo/react-hooks";
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
    ListItemTextSecondary,
    DataListModalOverlay,
    DataListModalOverlayAction
} from "@webiny/ui/List";

import { DeleteIcon } from "@webiny/ui/List/DataList/icons";
import { ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import SearchUI from "@webiny/app-admin/components/SearchUI";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { ReactComponent as FilterIcon } from "@webiny/app-admin/assets/icons/filter-24px.svg";

const t = i18n.ns("app-i18n/admin/locales/data-list");

const serializeSorters = data => {
    if (!data) {
        return data;
    }
    const [[key, value]] = Object.entries(data);
    return `${key}:${value}`;
};

const deserializeSorters = (data: string) => {
    if (typeof data !== "string") {
        return data;
    }

    const [key, value] = data.split(":");
    return { [key]: value };
};

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
    const [sort, setSort] = useState(serializeSorters(SORTERS[0].sorters));
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
            const [[key, value]] = Object.entries(deserializeSorters(sort));
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
                // Reload page
                window.location.reload();
            });
        },
        [code]
    );

    const localesDataListModalOverlay = useMemo(
        () => (
            <DataListModalOverlay>
                <Grid>
                    <Cell span={12}>
                        <Select value={sort} onChange={setSort} label={t`Sort by`}>
                            {SORTERS.map(({ label, sorters }) => {
                                return (
                                    <option key={label} value={serializeSorters(sorters)}>
                                        {label}
                                    </option>
                                );
                            })}
                        </Select>
                    </Cell>
                </Grid>
            </DataListModalOverlay>
        ),
        [sort]
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
                    <ButtonIcon icon={<AddIcon />} /> {t`New Locale`}
                </ButtonSecondary>
            }
            data={localeList}
            title={t`Locales`}
            search={
                <SearchUI
                    value={filter}
                    onChange={setFilter}
                    inputPlaceholder={t`Search locales`}
                />
            }
            modalOverlay={localesDataListModalOverlay}
            modalOverlayAction={<DataListModalOverlayAction icon={<FilterIcon />} />}
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
