"use client";
import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { type DocumentElement } from "@webiny/website-builder-sdk";
import { EditingElementRendererPresenter } from "./EditingElementRenderer.presenter.js";
import { LiveElementRenderer } from "../LiveElementRenderer.js";
import { useElementSlotDepth } from "../ElementSlotDepthProvider.js";
import { useElementIndex } from "../ElementIndexProvider.js";
import { useDocumentStore } from "../DocumentStoreProvider.js";
import { useContentClient } from "../useContentClient.js";

interface PreviewElementRendererProps {
    element: DocumentElement;
    /**
     * For a placement of a global component: the global's instance. The placement is what's selected,
     * moved and deleted; the instance is what renders, with its values.
     */
    instance?: DocumentElement;
}

const styles = { display: "contents" };

export const EditingElementRenderer = observer((props: PreviewElementRendererProps) => {
    const documentStore = useDocumentStore();
    const client = useContentClient();
    const depth = useElementSlotDepth();
    const index = useElementIndex();

    const rendered = props.instance ?? props.element;

    const presenter = useMemo(() => {
        const editingSdk = client.getEditingSdk();
        return new EditingElementRendererPresenter(documentStore, editingSdk);
    }, [rendered?.id, client, documentStore]);

    useEffect(() => {
        if (!rendered) {
            return;
        }
        presenter.init(rendered);
    }, [presenter, rendered?.id]);

    useEffect(() => {
        return () => {
            presenter.dispose();
        };
    }, [presenter]);

    const renderedElement = presenter.vm.element;
    const element = props.instance ? props.element : renderedElement;

    if (!element || !element.id || !renderedElement?.id) {
        return null;
    }

    return (
        <div
            style={styles}
            data-element-id={element.id}
            data-depth={depth}
            data-parent-index={index}
            data-parent-id={element.parent?.id}
            data-parent-slot={element.parent?.slot}
        >
            <LiveElementRenderer element={renderedElement} />
        </div>
    );
});
