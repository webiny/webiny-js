import React, { useMemo } from "react";
import { i18n } from "@webiny/app/i18n";
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
import { useLocalesList } from "./hooks/useLocalesList";
import { I18NLocaleItem } from "~/types";

const t = i18n.ns("app-i18n/admin/locales/data-list");

const SORTERS = [
    {
        label: t`Code A-Z` as string,
        sorter: "code_ASC"
    },
    {
        label: t`Code Z-A` as string,
        sorter: "code_DESC"
    }
];

const LocalesDataList = () => {
    const {
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
    } = useLocalesList({ sorters: SORTERS });

    const localesDataListModalOverlay = useMemo(
        () => (
            <DataListModalOverlay>
                <Grid>
                    <Cell span={12}>
                        <Select value={sort || ""} onChange={setSort} label={t`Sort by`}>
                            {SORTERS.map(({ label, sorter }) => {
                                return (
                                    <option key={label} value={sorter}>
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

    return (
        <DataList
            loading={loading}
            actions={
                <ButtonSecondary data-testid="new-record-button" onClick={createLocale}>
                    <ButtonIcon icon={<AddIcon />} /> {t`New Locale`}
                </ButtonSecondary>
            }
            data={locales}
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
            {({ data }: { data: I18NLocaleItem[] }) => (
                <ScrollList data-testid="default-data-list">
                    {data.map(item => (
                        <ListItem key={item.code} selected={item.code === currentLocaleCode}>
                            <ListItemText onClick={() => editLocale(item)}>
                                {item.code}
                                <ListItemTextSecondary>
                                    {item.default && t`Default locale`}
                                </ListItemTextSecondary>
                            </ListItemText>

                            <ListItemMeta>
                                <ListActions>
                                    <DeleteIcon
                                        onClick={() => deleteLocale(item)}
                                        data-testid={"default-data-list.delete"}
                                    />
                                </ListActions>
                            </ListItemMeta>
                        </ListItem>
                    ))}
                </ScrollList>
            )}
        </DataList>
    );
};

export default LocalesDataList;
