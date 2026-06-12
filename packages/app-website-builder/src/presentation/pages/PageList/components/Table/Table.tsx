import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { Table as AcoTable } from "@webiny/app-aco";
import { useListViewTableProps } from "@webiny/app-admin";
import { usePageListPresenter } from "../../../PageListPresenterProvider.js";
import { usePageListConfig } from "../../configs/index.js";
import type { TableRow } from "./TableRowMapper.js";
import { TableRowMapper } from "./TableRowMapper.js";

export const Table = observer(() => {
    const { vm, folders, list } = usePageListPresenter();
    const { browser } = usePageListConfig();

    const tableProps = useListViewTableProps({
        namespace: "wb/page/list",
        nameColumnId: "name"
    });

    const data = useMemo<TableRow[]>(() => {
        const pageRows = list.vm.rows.map(r => TableRowMapper.fromPage(r));
        if (!vm.showFolders) {
            return pageRows;
        }
        const folderRows = (folders.vm.childFolders ?? []).map(f => TableRowMapper.fromFolder(f));
        return [...folderRows, ...pageRows];
    }, [list.vm.rows, folders.vm.childFolders, vm.showFolders]);

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
