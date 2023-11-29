import React, { createContext, useContext } from "react";

import { TableItem } from "~/types";

export interface TableCellContext {
    item: TableItem;
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

    const value: TableCellContext = { item };

    return <TableCellContext.Provider value={value}>{children}</TableCellContext.Provider>;
};

export const useTableCell = () => {
    const context = useContext(TableCellContext);
    if (!context) {
        throw Error(
            `TableCellContext is missing in the component tree. Are you using "useTableCell()" hook in the right place?`
        );
    }

    return context;
};
