"use client";
import React, { useContext, useMemo } from "react";
import type { DocumentStore } from "@webiny/website-builder-sdk";
import { type Document } from "@webiny/website-builder-sdk";
import { useContentClient } from "./useContentClient.js";

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
    const client = useContentClient();
    const stores = client.getDocumentStoreManager();
    const store = useMemo(() => stores.getStore(id), [stores, id]);

    if (document) {
        store.setDocument(document);
    }

    return <DocumentStoreContext.Provider value={store}>{children}</DocumentStoreContext.Provider>;
};

export const useDocumentStore = (): DocumentStore => {
    const store = useContext(DocumentStoreContext);
    if (!store) {
        throw new Error("useDocumentStore must be used within a DocumentStoreProvider");
    }
    return store;
};
