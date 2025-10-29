import type { ForwardRefRenderFunction } from "react";
import React, { useMemo } from "react";
import { Table as AcoTable, createRecordsData, createFoldersData } from "@webiny/app-aco";
import { useContentEntriesList, useModel } from "~/admin/hooks/index.js";
import type { TableItem } from "~/types.js";

const BaseTable: ForwardRefRenderFunction<HTMLDivElement> = (_, ref) => {
    const { model } = useModel();
    const list = useContentEntriesList();

    const data = useMemo<TableItem[]>(() => {
        return [...createFoldersData(list.folders), ...createRecordsData(list.records)];
    }, [list.folders, list.records]);

    const selected = useMemo<TableItem[]>(() => {
        return createRecordsData(list.selected);
    }, [list.selected]);

    return (
        <div className={"mb-xl"} ref={ref}>
            <AcoTable<TableItem>
                data={data}
                nameColumnId={model.titleFieldId || "id"}
                namespace={`cms.${model.modelId}`}
                loading={list.isListLoading}
                onSortingChange={list.setSorting}
                sorting={list.sorting}
                onSelectRow={list.onSelectRow}
                selected={selected}
            />
        </div>
    );
};

export const Table = React.forwardRef<HTMLDivElement>(BaseTable);
Table.displayName = "Table";
