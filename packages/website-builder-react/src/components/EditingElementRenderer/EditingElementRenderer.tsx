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
}

const styles = { display: "contents" };

export const EditingElementRenderer = observer((props: PreviewElementRendererProps) => {
    const documentStore = useDocumentStore();
    const client = useContentClient();
    const depth = useElementSlotDepth();
    const index = useElementIndex();

    const presenter = useMemo(() => {
        const editingSdk = client.getEditingSdk();
        return new EditingElementRendererPresenter(documentStore, editingSdk);
    }, [props.element?.id]);

    useEffect(() => {
        if (!props.element) {
            return;
        }
        presenter.init(props.element);
    }, [props.element?.id]);

    useEffect(() => {
        return () => {
            presenter.dispose();
        };
    }, []);

    const element = presenter.vm.element;

    if (!element || !element.id) {
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
            <LiveElementRenderer element={element} />
        </div>
    );
});
