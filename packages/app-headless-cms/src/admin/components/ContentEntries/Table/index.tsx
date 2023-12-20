import React, { ForwardRefRenderFunction, useMemo } from "react";
import { Table as AcoTable } from "@webiny/app-aco";
import { useContentEntriesList, useModel } from "~/admin/hooks";
import { TableItem } from "~/types";

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
                namespace={`cms.${model.modelId}`}
                loading={list.isListLoading}
                onSortingChange={list.setSorting}
                sorting={list.sorting}
                onSelectRow={list.onSelectRow}
                selected={list.selected}
            />
        </div>
    );
};

export const Table = React.forwardRef<HTMLDivElement>(BaseTable);
Table.displayName = "Table";
