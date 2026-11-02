"use client";
import React, { useMemo } from "react";
import {
    type Component,
    type ContentClient,
    type Document,
    DocumentStore,
    type PublicLayout,
    withGlobalElementDefaults
} from "@webiny/website-builder-sdk";
import { editorComponents } from "../editorComponents/index.js";
import { DocumentStoreScope } from "./DocumentStoreProvider.js";
import { PageWithLayout, ReadOnlyScope } from "./PageLayout.js";
import { LayoutAreasProvider, type LayoutAreasValue } from "./LayoutAreas.js";
import { useContentClient } from "./useContentClient.js";

export interface LayoutRendererProps {
    // A layout delivered by slug, e.g. `sdk.wb.getLayout({ slug: model.settings.layout })`.
    layout: PublicLayout;
    // The components the layout uses, as for <DocumentRenderer>.
    components: Component[];
    // Content for the layout's named content areas, by area name. Areas not listed stay empty.
    areas?: Record<string, React.ReactNode>;
    // Rendered in the layout's Main content.
    children?: React.ReactNode;
}

/**
 * The layout comes composed like a page with no content of its own: the instances of the global components it
 * places, and the layout. A global that was never saved is rendered from its manifest defaults.
 */
const toLayoutPage = (layout: PublicLayout, client: ContentClient): Document => {
    const id = `layout:${layout.layout.id}`;
    const globals = withGlobalElementDefaults(
        { elements: layout.elements ?? {}, bindings: layout.bindings ?? {} },
        client.getComponentManifests()
    );

    return {
        id,
        version: 1,
        state: {},
        properties: { id },
        metadata: {},
        extensions: {},
        elements: globals.elements,
        bindings: globals.bindings,
        layout: layout.layout
    };
};

/**
 * Render content from code (e.g. a CMS entry) in a layout built in the layout editor: `children` go in its
 * Main content, and `areas` in its named content areas. It always renders as on the live site, also inside an
 * editor's preview: nothing in it can be selected.
 */
export const LayoutRenderer = ({ layout, components, areas, children }: LayoutRendererProps) => {
    const client = useContentClient();
    [...editorComponents, ...components].forEach(blueprint => client.registerComponent(blueprint));

    // Its own store, seeded on creation: never one shared by id across renders (or requests on the server).
    const store = useMemo(() => {
        const store = new DocumentStore();
        store.setDocument(toLayoutPage(layout, client));
        return store;
    }, [layout, client]);

    const content = useMemo<LayoutAreasValue>(
        () => ({ main: children, areas: areas ?? {} }),
        [children, areas]
    );

    return (
        <div data-role={"layout-renderer"}>
            <ReadOnlyScope>
                <LayoutAreasProvider value={content}>
                    <DocumentStoreScope store={store}>
                        <PageWithLayout />
                    </DocumentStoreScope>
                </LayoutAreasProvider>
            </ReadOnlyScope>
        </div>
    );
};
