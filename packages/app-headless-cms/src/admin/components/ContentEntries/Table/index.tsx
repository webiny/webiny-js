import React, { ForwardRefRenderFunction, useMemo } from "react";
import { Table as AcoTable } from "@webiny/app-aco";
import { useContentEntriesList, useModel } from "~/admin/hooks";
import { CmsContentEntry, EntryTableItem, TableItem } from "~/types";

const createRecordsData = (items: CmsContentEntry[]): EntryTableItem[] => {
    return items.map(item => {
        return {
            $type: "RECORD",
            $selectable: true,
            ...item
        };
    });
};

const BaseTable: ForwardRefRenderFunction<HTMLDivElement> = (_, ref) => {
    const { model } = useModel();
    const list = useContentEntriesList();

    const data = useMemo<TableItem[]>(() => {
        return (list.folders as TableItem[]).concat(list.records as TableItem[]);
    }, [list.folders, list.records]);

    return (
        <div ref={ref}>
            <AcoTable<TableItem>
                data={data}
                nameColumnId={model.titleFieldId || "id"}
                loading={list.isListLoading}
                onSortingChange={list.setSorting}
                sorting={list.sorting}
                onSelectRow={list.onSelectRow}
                selectedRows={createRecordsData(list.selected)}
            />
        </div>
    );
};

export const Table = React.forwardRef<HTMLDivElement>(BaseTable);
Table.displayName = "Table";
