import React, { Context, createContext, ReactNode, useContext } from "react";
import { DefaultData } from "@webiny/ui/DataTable";

export interface TableCellContextData<T> {
    item: T;
}

export const TableCellContext = createContext<TableCellContextData<any> | undefined>(undefined);

interface TableCellProviderProps<T> {
    item: T | undefined;
    children: ReactNode;
}

export const TableCellProvider = <T,>({ item, children }: TableCellProviderProps<T>) => {
    if (!item) {
        return null;
    }

    const value: TableCellContextData<T> = { item };

    return <TableCellContext.Provider value={value}>{children}</TableCellContext.Provider>;
};

export const useTableCell = <T extends Record<string, any> & DefaultData>() => {
    const context = useContext<TableCellContextData<T>>(
        TableCellContext as unknown as Context<TableCellContextData<T>>
    );

    if (!context) {
        throw Error(
            `TableCellContext is missing in the component tree. Are you using "useTableCell()" hook in the right place?`
        );
    }

    return context;
};
