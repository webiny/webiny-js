import React, { Context, createContext, ReactNode, useContext } from "react";
import { DefaultData } from "@webiny/ui/DataTable";

export interface TableRowContextData<T> {
    row: T;
}

export const TableRowContext = createContext<TableRowContextData<any> | undefined>(undefined);

interface TableRowProviderProps<T> {
    row: T | undefined;
    children: ReactNode;
}

export const TableRowProvider = <T,>({ row, children }: TableRowProviderProps<T>) => {
    if (!row) {
        return null;
    }

    const value: TableRowContextData<T> = { row };

    return <TableRowContext.Provider value={value}>{children}</TableRowContext.Provider>;
};

export const createUseTableRow = <TBaseRow = Record<string, any>,>() => {
    return <TUserRow = Record<string, any>,>() => {
        const context = useContext<TableRowContextData<TBaseRow & DefaultData & TUserRow>>(
            TableRowContext as unknown as Context<
                TableRowContextData<TBaseRow & DefaultData & TUserRow>
            >
        );

        if (!context) {
            throw Error(
                `TableRowContext is missing in the component tree. Are you using "useTableRow()" hook in the right place?`
            );
        }

        return context;
    };
};
