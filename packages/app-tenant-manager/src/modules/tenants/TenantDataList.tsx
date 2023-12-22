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

import { ButtonIcon, ButtonSecondary, IconButton } from "@webiny/ui/Button";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import SearchUI from "@webiny/app-admin/components/SearchUI";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { ReactComponent as FilterIcon } from "@webiny/app-admin/assets/icons/filter-24px.svg";
import { ReactComponent as LoginIcon } from "~/assets/login_black_24dp.svg";
import { useTenantsList } from "./hooks/useTenantsList";
import { useTenancy } from "@webiny/app-tenancy";
import { TenantItem } from "~/types";

const t = i18n.ns("app-i18n/admin/locales/data-list");

interface Sorter {
    label: string;
    sorter: string;
}
const SORTERS: Sorter[] = [
    {
        label: t`Name A-Z` as string,
        sorter: "name_ASC"
    },
    {
        label: t`Name Z-A` as string,
        sorter: "name_DESC"
    }
];

const TenantDataList = () => {
    const {
        tenants,
        loading,
        currentTenantId,
        createTenant,
        filter,
        setFilter,
        sort,
        setSort,
        editTenant
    } = useTenantsList({ sorters: SORTERS });

    const { setTenant } = useTenancy();

    const tenantsDataListModalOverlay = useMemo(
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
                <ButtonSecondary data-testid="new-record-button" onClick={createTenant}>
                    <ButtonIcon icon={<AddIcon />} /> {t`New Tenant`}
                </ButtonSecondary>
            }
            data={tenants}
            title={t`Tenants`}
            setSorters={setSort}
            search={
                <SearchUI
                    value={filter}
                    onChange={setFilter}
                    inputPlaceholder={t`Search tenants`}
                />
            }
            modalOverlay={tenantsDataListModalOverlay}
            modalOverlayAction={<DataListModalOverlayAction icon={<FilterIcon />} />}
        >
            {({ data }: { data: TenantItem[] }) => (
                <ScrollList data-testid="default-data-list">
                    {data.map(item => (
                        <ListItem key={item.id} selected={item.id === currentTenantId}>
                            <ListItemText onClick={() => editTenant(item.id)}>
                                {item.name}
                                <ListItemTextSecondary>{item.description}</ListItemTextSecondary>
                            </ListItemText>

                            <ListItemMeta>
                                <ListActions>
                                    <IconButton
                                        icon={<LoginIcon />}
                                        onClick={() => setTenant(item.id)}
                                    />
                                    {/* <DeleteIcon
                                        onClick={() => deleteTenant(item)}
                                        data-testid={"default-data-list.delete"}
                                    />*/}
                                </ListActions>
                            </ListItemMeta>
                        </ListItem>
                    ))}
                </ScrollList>
            )}
        </DataList>
    );
};

export default TenantDataList;
