import React, { useMemo } from "react";
import { Button, Grid, Select } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { i18n } from "@webiny/app/i18n/index.js";
import {
    DataList,
    ScrollList,
    ListItem,
    ListItemText,
    ListItemMeta,
    ListActions,
    ListItemTextSecondary,
    DataListModalOverlay,
    DataListModalOverlayAction,
    ListItemTextPrimary,
    LoginIcon
} from "@webiny/ui/List/index.js";
import { SearchUI } from "@webiny/app-admin";
import { useTenantsList } from "./hooks/useTenantsList.js";
import { useTenancy } from "@webiny/app-admin";
import type { TenantItem } from "~/types.js";

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
                    <Grid.Column span={12}>
                        <Select
                            value={sort || ""}
                            onChange={setSort}
                            label={t`Sort by`}
                            options={SORTERS.map(({ label, sorter: value }) => {
                                return {
                                    label,
                                    value
                                };
                            })}
                        />
                    </Grid.Column>
                </Grid>
            </DataListModalOverlay>
        ),
        [sort]
    );

    return (
        <DataList
            loading={loading}
            actions={
                <Button
                    text={t`New`}
                    icon={<AddIcon />}
                    size={"sm"}
                    className={"wby-ml-xs"}
                    ata-testid="new-record-button"
                    onClick={createTenant}
                />
            }
            data={tenants}
            title={t`Tenants`}
            setSorters={setSort}
            search={
                <SearchUI
                    value={filter}
                    onChange={setFilter}
                    inputPlaceholder={t`Search tenants...`}
                    dataTestId={"tenants.data-list.search-input"}
                />
            }
            modalOverlay={tenantsDataListModalOverlay}
            modalOverlayAction={<DataListModalOverlayAction />}
        >
            {({ data }: { data: TenantItem[] }) => (
                <ScrollList data-testid="default-data-list">
                    {data.map(item => (
                        <ListItem key={item.id} selected={item.id === currentTenantId}>
                            <ListItemText onClick={() => editTenant(item.id)}>
                                <ListItemTextPrimary>{item.name}</ListItemTextPrimary>
                                <ListItemTextSecondary>{item.description}</ListItemTextSecondary>
                            </ListItemText>

                            <ListItemMeta>
                                <ListActions>
                                    <LoginIcon onClick={() => setTenant(item.id)} />
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
