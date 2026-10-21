"use client";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { toJS } from "mobx";
import {
    type Document,
    DocumentStore,
    type PageLayout as PageLayoutData
} from "@webiny/website-builder-sdk";
import { DocumentStoreScope, useDocumentStore } from "./DocumentStoreProvider.js";
import { ElementRenderer } from "./ElementRenderer.js";
import { type DocumentLayout, renderWithLayout } from "./renderWithLayout.js";

interface PageLayoutContextValue {
    // The store of the page the layout is rendered around.
    pageStore: DocumentStore;
}

const PageLayoutContext = React.createContext<PageLayoutContextValue | undefined>(undefined);

/**
 * Set while rendering the elements of a page's layout. They belong to the layout, not to the page: in the
 * page editor, they can be selected (to override their inputs on the page), but not moved or dropped into.
 */
export const usePageLayout = () => {
    return useContext(PageLayoutContext);
};

/**
 * Render from the page again, from within its layout: the page content, and the instances of the global
 * components the layout places (they come with the page, and the page editor edits them there).
 */
export const PageScope = ({ children }: { children: React.ReactNode }) => {
    const pageLayout = usePageLayout();
    if (!pageLayout) {
        return <>{children}</>;
    }

    return (
        <PageLayoutContext.Provider value={undefined}>
            <DocumentStoreScope store={pageLayout.pageStore}>{children}</DocumentStoreScope>
        </PageLayoutContext.Provider>
    );
};

const ReadOnlyContext = React.createContext(false);

/**
 * Everything inside renders as on the live site, even in the editor: it can't be selected or dropped into
 * (e.g., the page previewed inside a layout in the layout editor).
 */
export const ReadOnlyScope = ({ children }: { children: React.ReactNode }) => {
    return <ReadOnlyContext.Provider value={true}>{children}</ReadOnlyContext.Provider>;
};

export const useIsReadOnlyScope = () => {
    return useContext(ReadOnlyContext);
};

/**
 * The layout comes complete: on the live site the backend merges the page's overrides of the layout's
 * elements into it, and the page editor sends it to the preview the same way.
 */
const toLayoutDocument = (layout: PageLayoutData): Document => {
    return {
        id: layout.id,
        version: 1,
        state: {},
        properties: { id: layout.id },
        metadata: { documentType: "layout" },
        extensions: {},
        elements: layout.elements ?? {},
        bindings: layout.bindings ?? {}
    };
};

const LayoutRenderer = ({ layoutJson }: { layoutJson: string }) => {
    const pageStore = useDocumentStore();
    const context = useMemo(() => ({ pageStore }), [pageStore]);
    // The layout comes with the page's overrides merged in, so it is different for every page: each render
    // gets its own store, never one shared by layout id across pages (or across requests on the server).
    const document = useMemo<Document>(() => JSON.parse(layoutJson), [layoutJson]);
    // Seeded on creation, so the first render (and the server render) has the layout.
    const [layoutStore] = useState(() => {
        const store = new DocumentStore();
        store.setDocument(document);
        return store;
    });
    const appliedDocument = useRef(document);

    // A changed layout (e.g. patched in the page editor) goes into the store after render: writing an
    // observable store while rendering would update its observers during someone else's render.
    useEffect(() => {
        if (appliedDocument.current === document) {
            return;
        }
        appliedDocument.current = document;
        layoutStore.setDocument(document);
    }, [document]);

    return (
        <PageLayoutContext.Provider value={context}>
            <DocumentStoreScope store={layoutStore}>
                <ElementRenderer id={"root"} />
            </DocumentStoreScope>
        </PageLayoutContext.Provider>
    );
};

/**
 * Render the page in its layout: the one picked in the page settings, built in the layout editor, or
 * else the `layout` the frontend passes to <DocumentRenderer>.
 */
export const PageWithLayout = observer(({ layout }: { layout?: DocumentLayout }) => {
    const pageStore = useDocumentStore();
    const page = pageStore.getDocument();
    // In the page editor, the layout is patched in place: reading all of it re-renders on any change.
    const layoutJson = page?.layout ? JSON.stringify(toLayoutDocument(toJS(page.layout))) : null;

    if (layoutJson) {
        return <LayoutRenderer layoutJson={layoutJson} />;
    }

    return renderWithLayout(<ElementRenderer id={"root"} />, layout);
});
