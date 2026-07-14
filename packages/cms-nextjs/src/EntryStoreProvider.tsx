"use client";

import React, { useContext, useMemo } from "react";
import { type EntryStore, entryStoreManager, type CmsEntry } from "@webiny/cms-sdk";

const EntryStoreContext = React.createContext<EntryStore | undefined>(undefined);

interface EntryStoreProviderProps {
    entryId: string;
    entry?: CmsEntry;
    children: React.ReactNode;
}

export const EntryStoreProvider = ({ entryId, entry, children }: EntryStoreProviderProps) => {
    const store = useMemo(() => entryStoreManager.getStore(entryId), [entryId]);

    if (entry) {
        store.setEntry(entry);
    }

    return <EntryStoreContext.Provider value={store}>{children}</EntryStoreContext.Provider>;
};

export const useEntryStore = (): EntryStore => {
    const store = useContext(EntryStoreContext);
    if (!store) {
        throw new Error("useEntryStore must be used within an EntryStoreProvider");
    }
    return store;
};
