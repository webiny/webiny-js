import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { toJS } from "mobx";
import {
    contentSdk,
    type Document,
    LayoutContentArea,
    type PreviewPage,
    withGlobalElementDefaults
} from "@webiny/website-builder-sdk";
import { ElementRenderer } from "~/components/ElementRenderer.js";
import { ElementSlot } from "~/components/ElementSlot.js";
import type { ComponentProps } from "~/types.js";
import { DocumentStoreProvider, useDocumentStore } from "~/components/DocumentStoreProvider.js";
import { PageScope, ReadOnlyScope, usePageLayout } from "~/components/PageLayout.js";
import { SlotLabel } from "~/components/SlotLabel.js";
import {
    getLayoutAreaContent,
    LayoutAreasProvider,
    useLayoutAreas
} from "~/components/LayoutAreas.js";
import { getContentAreaLabel } from "./LayoutContentLabel.js";

const toPreviewDocument = (page: PreviewPage): Document => {
    const document: Document = {
        id: page.id,
        version: 1,
        state: {},
        extensions: {},
        metadata: {},
        properties: page.properties ?? { id: page.id },
        elements: page.elements ?? {},
        bindings: page.bindings ?? {}
    };

    // Globals the page has no stored instance of render from their manifest defaults, as on the live site.
    const withDefaults = withGlobalElementDefaults(document, contentSdk.getComponentManifests());
    return { ...document, elements: withDefaults.elements, bindings: withDefaults.bindings };
};

/**
 * The page's content of one area. The main area is the page root, as on a page without a layout; the
 * others are slots of the page root. In the page editor, each is a place to drop content.
 */
const PageArea = observer(({ area }: { area: LayoutContentArea }) => {
    const documentStore = useDocumentStore();
    const slot = area.slot();

    // While an area is empty, its drop area in the page editor says which one it is.
    if (area.isMain()) {
        return (
            <SlotLabel parentId={"root"} slot={slot} label={getContentAreaLabel(area)}>
                <ElementRenderer id={"root"} />
            </SlotLabel>
        );
    }

    const ids = documentStore.getDocument()?.bindings.root?.inputs?.[slot]?.static;

    return (
        <SlotLabel parentId={"root"} slot={slot} label={getContentAreaLabel(area)}>
            <ElementSlot
                parentId={"root"}
                slot={slot}
                elements={Array.isArray(ids) ? [...ids] : []}
            />
        </SlotLabel>
    );
});

/**
 * In the layout editor, the page picked to preview the layout with: shown in place of the page content,
 * as on the live site. It can't be selected; it belongs to the page, not to the layout.
 */
const PreviewPageContent = ({ pageJson, area }: { pageJson: string; area: LayoutContentArea }) => {
    const document = useMemo(() => toPreviewDocument(JSON.parse(pageJson)), [pageJson]);

    return (
        <ReadOnlyScope>
            <DocumentStoreProvider id={`preview-page:${document.id}`} document={document}>
                <PageArea area={area} />
            </DocumentStoreProvider>
        </ReadOnlyScope>
    );
};

const Placeholder = ({ area }: { area: LayoutContentArea }) => {
    return (
        <div
            style={{
                display: "flex",
                minHeight: "200px",
                backgroundColor: "#f4f4f4",
                border: "2px dashed #d0d0d0",
                justifyContent: "center",
                alignItems: "center",
                color: "#6b6b6b"
            }}
        >
            {getContentAreaLabel(area)}
        </div>
    );
};

const LayoutEditorContent = observer(({ area }: { area: LayoutContentArea }) => {
    const documentStore = useDocumentStore();
    const previewPage = documentStore.getDocument()?.previewPage;

    if (previewPage) {
        return <PreviewPageContent pageJson={JSON.stringify(toJS(previewPage))} area={area} />;
    }

    return <Placeholder area={area} />;
});

/**
 * A page content area: where a page renders its own content of that area inside a layout. In the layout
 * editor, there is no page: it shows a placeholder, or the page picked to preview the layout with.
 */
const ContentArea = ({ area }: { area: LayoutContentArea }) => {
    const pageLayout = usePageLayout();
    const layoutAreas = useLayoutAreas();

    // Content from code rendered in the layout (see <LayoutRenderer>). It's not part of the layout, so
    // nothing of the layout is around it any more.
    if (layoutAreas) {
        return (
            <PageScope>
                <LayoutAreasProvider value={undefined}>
                    {getLayoutAreaContent(layoutAreas, area)}
                </LayoutAreasProvider>
            </PageScope>
        );
    }

    if (pageLayout) {
        return (
            <PageScope>
                <PageArea area={area} />
            </PageScope>
        );
    }

    if (!contentSdk.isEditing()) {
        return null;
    }

    return <LayoutEditorContent area={area} />;
};

export const MainContentComponent = ({ element }: ComponentProps) => {
    return <ContentArea area={LayoutContentArea.fromElement(element)} />;
};

export const NamedContentComponent = ({ inputs, element }: ComponentProps<{ area?: string }>) => {
    return <ContentArea area={LayoutContentArea.fromElement(element, inputs?.area)} />;
};
