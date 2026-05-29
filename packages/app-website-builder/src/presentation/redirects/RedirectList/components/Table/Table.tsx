import React, { useMemo } from "react";
import { Table as AcoTable } from "@webiny/app-aco";
import { observer } from "mobx-react-lite";
import { useRedirectListPresenter } from "~/presentation/redirects/RedirectList/index.js";
import { useRedirectListConfig } from "~/presentation/redirects/RedirectList/configs/RedirectListConfig.js";
import type { TableRow } from "~/presentation/redirects/RedirectList/components/TableRowMapper.js";
import { TableRowMapper } from "~/presentation/redirects/RedirectList/components/TableRowMapper.js";

export const Table = observer(() => {
    const { vm, actions } = useRedirectListPresenter();
    const { browser } = useRedirectListConfig();

    const data = useMemo<TableRow[]>(() => {
        const redirectRows = vm.list.rows.map(r => TableRowMapper.fromRedirect(r));
        if (!vm.showFolders) {
            return redirectRows;
        }
        const folderRows = (vm.folders.childFolders ?? []).map(f => TableRowMapper.fromFolder(f));
        return [...folderRows, ...redirectRows];
    }, [vm.list.rows, vm.folders.childFolders, vm.showFolders]);

    const sorting = useMemo(() => {
        if (!vm.list.sort) {
            return [];
        }
        return [{ id: vm.list.sort.field, desc: vm.list.sort.direction === "DESC" }];
    }, [vm.list.sort]);

    const selected = useMemo<TableRow[]>(() => {
        const selectedIds = vm.list.selection.selectedIds;
        return data.filter(row => selectedIds.has(row.id));
    }, [data, vm.list.selection.selectedIds]);

    return (
        <AcoTable<TableRow>
            columns={browser.table.columns}
            data={data}
            loading={vm.list.pagination.loading}
            sorting={sorting}
            onSortingChange={updater => {
                const newSorting = typeof updater === "function" ? updater(sorting) : updater;
                if (newSorting.length > 0) {
                    actions.sort.set(newSorting[0].id, newSorting[0].desc ? "DESC" : "ASC");
                }
            }}
            onSelectRow={documents => {
                const ids = documents.map(d => d.id);
                actions.selection.selectRows(ids);
            }}
            selected={selected}
            nameColumnId={"redirectFrom"}
            namespace={"wb/redirect/list"}
        />
    );
});
