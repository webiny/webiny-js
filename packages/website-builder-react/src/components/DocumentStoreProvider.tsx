"use client";
import React, { useContext, useMemo } from "react";
import type { DocumentStore } from "@webiny/website-builder-sdk";
import { type Document, documentStoreManager } from "@webiny/website-builder-sdk";

const DocumentStoreContext = React.createContext<DocumentStore | undefined>(undefined);

export const DocumentStoreProvider = ({
    id,
    document,
    children
}: {
    id: string;
    document?: Document;
    children: React.ReactNode;
}) => {
    const store = useMemo(() => documentStoreManager.getStore(id), [id]);

    if (document) {
        store.setDocument(document);
    }

    return <DocumentStoreContext.Provider value={store}>{children}</DocumentStoreContext.Provider>;
};

/**
 * Render children from an existing store, e.g. to switch from a layout back to the page it's rendered around.
 */
export const DocumentStoreScope = ({
    store,
    children
}: {
    store: DocumentStore;
    children: React.ReactNode;
}) => {
    return <DocumentStoreContext.Provider value={store}>{children}</DocumentStoreContext.Provider>;
};

export const useDocumentStore = (): DocumentStore => {
    const store = useContext(DocumentStoreContext);
    if (!store) {
        throw new Error("useDocumentStore must be used within a DocumentStoreProvider");
    }
    return store;
};
