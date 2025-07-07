"use client";
import React from "react";
import { observer } from "mobx-react-lite";
import { environment } from "@webiny/app-website-builder/sdk";
import { EditingElementRenderer } from "./EditingElementRenderer/EditingElementRenderer.js";
import { LiveElementRenderer } from "./LiveElementRenderer.js";
import { useDocumentStore } from "./DocumentStoreProvider.js";

interface ElementRendererProps {
    id: string;
}

export const ElementRenderer = observer((props: ElementRendererProps) => {
    const documentStore = useDocumentStore();
    const isEditing = environment.isEditing();
    const element = documentStore.getElement(props.id);

    if (!element) {
        return null;
    }

    if (isEditing) {
        return <EditingElementRenderer element={element} />;
    } else {
        return <LiveElementRenderer element={element} />;
    }
});
