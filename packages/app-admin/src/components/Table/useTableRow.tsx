import type { Context, ReactNode } from "react";
import React, { createContext, useContext } from "react";

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
    function useTableRow(): TableRowContextData<TBaseRow>;

    // 	function useTableRow(): TableRowContextData<TBaseRow>;
    //  ➜ Handles calls with no generic.

    // 	function useTableRow<TUserRow>(): TableRowContextData<TBaseRow & { data: TUserRow }>;
    //  ➜ Handles calls with a generic.

    function useTableRow<TUserRow>(): TableRowContextData<TBaseRow & { data: TUserRow }>;

    function useTableRow<TUserRow = never>(): TableRowContextData<
        TUserRow extends never ? TBaseRow : TBaseRow & { data: TUserRow }
    > {
        type Combined = TUserRow extends never ? TBaseRow : TBaseRow & { data: TUserRow };

        const context = useContext<TableRowContextData<Combined>>(
            TableRowContext as unknown as Context<TableRowContextData<Combined>>
        );

        if (!context) {
            throw new Error(
                `TableRowContext is missing in the component tree. Are you using "useTableRow()" hook in the right place?`
            );
        }

        return context;
    }

    return useTableRow;
};
