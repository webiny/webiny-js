import React, { createContext } from "react";

import { FileTableItem, TableItem } from "~/types";

export interface TableCellContext {
    item: TableItem;
    isFileItem: (item: TableItem) => item is FileTableItem;
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

    function isFileItem(item: TableItem): item is FileTableItem {
        return item?.$type === "RECORD";
    }

    const value: TableCellContext = { item, isFileItem };

    return <TableCellContext.Provider value={value}>{children}</TableCellContext.Provider>;
};

export const useTableCell = () => {
    const context = React.useContext(TableCellContext);
    if (!context) {
        throw Error(
            `TableCelContext is missing in the component tree. Are you using "useTableCell()" hook in the right place?`
        );
    }

    return context;
};
