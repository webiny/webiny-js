import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { Table as AcoTable } from "@webiny/app-aco";
import { useListViewTableProps } from "@webiny/app-admin";
import { useContainer } from "@webiny/app";
import { usePageListPresenter } from "../../PageListPresenterProvider.js";
import { usePageListConfig } from "../../configs/index.js";
import { TableRowMapper, folderToTableRow } from "./abstractions.js";

export const Table = observer(() => {
    const { vm, list } = usePageListPresenter();
    const { browser } = usePageListConfig();
    const container = useContainer();
    const mapper = container.resolve(TableRowMapper);

    const tableProps = useListViewTableProps({
        namespace: "wb/page/list",
        nameColumnId: "name"
    });

    const data = useMemo<TableRowMapper.TableRow[]>(() => {
        const pageRows = list.vm.rows.map(r => mapper.fromPage(r));
        if (!vm.showFolders) {
            return pageRows;
        }
        const folderRows = vm.childFolders.map(f => folderToTableRow(f));
        return [...folderRows, ...pageRows];
    }, [list.vm.rows, vm.childFolders, vm.showFolders]);

    const selected = useMemo<TableRowMapper.TableRow[]>(() => {
        return data.filter(row => tableProps.selectedIds.has(row.id));
    }, [data, tableProps.selectedIds]);

    return (
        <AcoTable<TableRowMapper.TableRow>
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
