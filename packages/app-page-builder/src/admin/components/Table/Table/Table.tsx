import React, { ForwardRefRenderFunction, useMemo } from "react";

import { createFoldersData, createRecordsData, Table as AcoTable } from "@webiny/app-aco";
import { usePagesList } from "~/admin/views/Pages/hooks/usePagesList";

import { TableItem } from "~/types";

const BaseTable: ForwardRefRenderFunction<HTMLDivElement> = (_, ref) => {
    const list = usePagesList();

    const data = useMemo<TableItem[]>(() => {
        return [...createFoldersData(list.folders), ...createRecordsData(list.records)];
    }, [list.folders, list.records]);

    return (
        <div ref={ref}>
            <AcoTable<TableItem>
                data={data}
                loading={list.isListLoading}
                onSelectRow={list.onSelectRow}
                sorting={list.sorting}
                onSortingChange={list.setSorting}
                selected={list.selected}
                namespace={"pb.page"}
            />
        </div>
    );
};

export const Table = React.forwardRef<HTMLDivElement>(BaseTable);
Table.displayName = "Table";
