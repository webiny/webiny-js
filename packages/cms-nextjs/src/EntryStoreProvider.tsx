"use client";

import React, { useContext, useMemo } from "react";
import {
    type EntryStore,
    type EntryStoreConfig,
    entryStoreManager,
    type CmsEntry
} from "@webiny/cms-sdk";

const EntryStoreContext = React.createContext<EntryStore | undefined>(undefined);

interface EntryStoreProviderProps {
    entryId: string;
    entry?: CmsEntry;
    storeConfig?: EntryStoreConfig;
    children: React.ReactNode;
}

export const EntryStoreProvider = ({
    entryId,
    entry,
    storeConfig,
    children
}: EntryStoreProviderProps) => {
    const store = useMemo(() => entryStoreManager.getStore(entryId), [entryId]);

    if (storeConfig) {
        store.configure(storeConfig);
    }

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
