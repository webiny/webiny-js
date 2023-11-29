import React, { createContext } from "react";

import { EntryTableItem, TableItem } from "~/types";

export interface TableCellContext {
    item: TableItem;
    isEntryItem: (item: TableItem) => item is EntryTableItem;
}

export const TableCellContext = createContext<TableCellContext | undefined>(undefined);

interface TableCellProviderProps {
    item: TableItem | undefined;
    children: React.ReactNode;
}

export const TableCellProvider = ({ item, children }: TableCellProviderProps) => {
    if (!item) {
        return null;
    }

    function isEntryItem(item: TableItem): item is EntryTableItem {
        return item?.$type === "RECORD";
    }

    const value: TableCellContext = { item, isEntryItem };

    return <TableCellContext.Provider value={value}>{children}</TableCellContext.Provider>;
};

export const useTableCell = () => {
    const context = React.useContext(TableCellContext);
    if (!context) {
        throw Error(
            `TableCellContext is missing in the component tree. Are you using "useTableCell()" hook in the right place?`
        );
    }

    return context;
};
