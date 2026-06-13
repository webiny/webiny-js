import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { Table as AcoTable } from "@webiny/app-aco";
import { useListViewTableProps } from "@webiny/app-admin";
import { useContentEntryListConfig } from "~/admin/config/contentEntries/list/ContentEntryListConfig.js";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/list/useContentEntriesPresenter.js";
import { TableRowMapper, type TableRow } from "./TableRowMapper.js";

export const Table = observer(() => {
    const presenter = useContentEntriesPresenter();
    const { browser } = useContentEntryListConfig();

    const tableProps = useListViewTableProps({
        namespace: `cms/${presenter.vm.model.modelId}/list`,
        nameColumnId: "name"
    });

    const data = useMemo<TableRow[]>(() => {
        const entryRows = presenter.list.vm.rows.map(entry => TableRowMapper.fromEntry(entry));

        if (!presenter.vm.showFolders) {
            return entryRows;
        }

        const folderRows = (presenter.folders.vm.childFolders ?? []).map(f =>
            TableRowMapper.fromFolder(f)
        );
        return [...folderRows, ...entryRows];
    }, [presenter.list.vm.rows, presenter.folders.vm.childFolders, presenter.vm.showFolders]);

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
