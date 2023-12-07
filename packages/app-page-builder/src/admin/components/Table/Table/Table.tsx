import React, { ForwardRefRenderFunction, useMemo } from "react";

import { Table as AcoTable } from "@webiny/app-aco";
import { usePagesList } from "~/admin/views/Pages/hooks/usePagesList";

import { FolderItem, FolderTableItem, SearchRecordItem } from "@webiny/app-aco/types";
import { PbPageDataItem, PbPageTableItem, TableItem } from "~/types";

const createRecordsData = (items: SearchRecordItem<PbPageDataItem>[]): PbPageTableItem[] => {
    return items.map(item => {
        return {
            $type: "RECORD",
            $selectable: true,
            ...item
        };
    });
};

const createFoldersData = (items: FolderItem[]): FolderTableItem[] => {
    return items.map(item => {
        return {
            $type: "FOLDER",
            $selectable: false,
            ...item
        };
    });
};

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
            />
        </div>
    );
};

export const Table = React.forwardRef<HTMLDivElement>(BaseTable);
Table.displayName = "Table";
