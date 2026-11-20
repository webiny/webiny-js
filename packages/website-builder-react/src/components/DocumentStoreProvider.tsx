"use client";
import React, { useContext, useLayoutEffect, useMemo, useRef } from "react";
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

    // The document last put into the store (the store keeps an observable copy of it).
    const applied = useRef<Document | undefined>(undefined);

    // The first document goes in during render, so the children's first render reads it (nothing
    // has subscribed to the store yet).
    if (document && !store.getDocument()) {
        store.setDocument(document);
        applied.current = document;
    }

    // A new document goes in after the render: setting it during render would update the
    // subscribed children while this component renders. Before paint, so the old one never shows.
    useLayoutEffect(() => {
        if (document && document !== applied.current) {
            store.setDocument(document);
            applied.current = document;
        }
    }, [store, document]);

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
