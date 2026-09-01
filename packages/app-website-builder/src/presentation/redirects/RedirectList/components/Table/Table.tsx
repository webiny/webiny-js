import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { Table as AcoTable } from "@webiny/app-aco";
import { useListViewTableProps } from "@webiny/app-admin";
import { useRedirectListPresenter } from "~/presentation/redirects/RedirectList/index.js";
import { useRedirectListConfig } from "~/presentation/redirects/RedirectList/configs/RedirectListConfig.js";
import type { TableRow } from "./TableRowMapper.js";
import { TableRowMapper } from "./TableRowMapper.js";

export const Table = observer(() => {
    const { vm } = useRedirectListPresenter();
    const { browser } = useRedirectListConfig();

    const tableProps = useListViewTableProps({
        namespace: "wb/redirect/list",
        nameColumnId: "redirectFrom"
    });

    const data = useMemo<TableRow[]>(() => {
        const redirectRows = vm.list.rows.map(r => TableRowMapper.fromRedirect(r));
        if (!vm.showFolders) {
            return redirectRows;
        }
        const folderRows = vm.childFolders.map(f => TableRowMapper.fromFolder(f));
        return [...folderRows, ...redirectRows];
    }, [vm.list.rows, vm.childFolders, vm.showFolders]);

    const selected = useMemo<TableRow[]>(() => {
        return data.filter(row => tableProps.selectedIds.has(row.id));
    }, [data, tableProps.selectedIds]);

    return (
        <AcoTable<TableRow>
            columns={browser.table.columns}
            data={data}
            loading={tableProps.loading}
            sorting={tableProps.sorting}
            onSortingChange={tableProps.onSortingChange}
            onSelectRow={tableProps.onSelectRow}
            selected={selected}
            nameColumnId={tableProps.nameColumnId}
            namespace={tableProps.namespace}
        />
    );
});
