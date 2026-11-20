"use client";
import { useEffect, useRef, useState } from "react";
import { type Document, DocumentStore } from "@webiny/website-builder-sdk";

/**
 * A store of its own for a document rendered inside another one (a page's layout, the page previewed in the
 * layout editor): never one shared by id across renders, or across requests on the server.
 *
 * It's seeded on creation, so the first render (and the server render) has the document. A changed document
 * goes into the store after render: writing an observable store while rendering would update its observers
 * during someone else's render.
 */
export const useSeededDocumentStore = (document: Document) => {
    const [store] = useState(() => {
        const store = new DocumentStore();
        store.setDocument(document);
        return store;
    });
    const appliedDocument = useRef(document);

    useEffect(() => {
        if (appliedDocument.current === document) {
            return;
        }
        appliedDocument.current = document;
        store.setDocument(document);
    }, [document]);

    return store;
};
