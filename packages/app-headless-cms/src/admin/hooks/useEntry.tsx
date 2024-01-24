import React, { createContext } from "react";
import { EntryTableItem } from "~/types";

export interface EntryContext {
    entry: EntryTableItem;
}

export const EntryContext = createContext<EntryContext | undefined>(undefined);

interface EntryProviderProps {
    entry: EntryTableItem;
    children: React.ReactNode;
}

export const EntryProvider = ({ entry, children }: EntryProviderProps) => {
    const value: EntryContext = { entry };

    return <EntryContext.Provider value={value}>{children}</EntryContext.Provider>;
};

export const useEntry = () => {
    const context = React.useContext(EntryContext);
    if (!context) {
        throw Error(
            `EntryContext is missing in the component tree. Are you using "useEntry()" hook in the right place?`
        );
    }

    return context;
};
