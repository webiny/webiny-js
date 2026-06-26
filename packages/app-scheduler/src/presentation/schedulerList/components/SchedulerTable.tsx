import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { createRecordsData, Table as AcoTable } from "@webiny/app-aco";
import { useSchedulerListConfig } from "~/presentation/configs/index.js";
import type { SchedulerEntryTableRow } from "~/types.js";
import type { ISchedulerListPresenter } from "../abstractions.js";

interface SchedulerTableProps {
    presenter: ISchedulerListPresenter;
}

export const SchedulerTable = observer(({ presenter }: SchedulerTableProps) => {
    const { vm } = presenter.list;
    const { browser } = useSchedulerListConfig();

    const data = useMemo<SchedulerEntryTableRow[]>(() => {
        return createRecordsData(vm.rows);
    }, [vm.rows]);

    const selected = useMemo<SchedulerEntryTableRow[]>(() => {
        const selectedIds = vm.selection.selectedIds;
        return data.filter(row => selectedIds.has(row.id));
    }, [data, vm.selection.selectedIds]);

    const sorting = useMemo(() => {
        if (!vm.sort) {
            return [];
        }
        return [{ id: vm.sort.field, desc: vm.sort.direction === "DESC" }];
    }, [vm.sort]);

    return (
        <AcoTable<SchedulerEntryTableRow>
            columns={browser.table.columns}
            data={data}
            loading={vm.pagination.loading}
            onSelectRow={entries =>
                presenter.list.actions.selection.selectRows(entries.map(entry => entry.id))
            }
            sorting={sorting}
            onSortingChange={sort => {
                if (typeof sort === "function") {
                    const newSort = sort(sorting);
                    if (newSort.length > 0) {
                        presenter.list.actions.sort.set(
                            newSort[0].id,
                            newSort[0].desc ? "DESC" : "ASC"
                        );
                    }
                }
            }}
            selected={selected}
            nameColumnId={"title"}
            namespace={"scheduler/list"}
        />
    );
});
