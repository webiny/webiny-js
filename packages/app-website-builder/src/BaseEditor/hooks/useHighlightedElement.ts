import { autorun, toJS } from "mobx";
import { useEffect, useState } from "react";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import type { DocumentElement } from "@webiny/website-builder-sdk";
import isEqual from "lodash/isEqual.js";
import { $getEditableElement } from "~/editorSdk/utils/$getEditableElement.js";

export const useHighlightedElement = () => {
    const [highlightedElement, setHighlightedElement] = useState<DocumentElement | null>(null);
    const editor = useDocumentEditor();

    useEffect(() => {
        return autorun(() => {
            const editorState = editor.getEditorState().read();
            const documentState = editor.getDocumentState().read();

            const elementId = editorState.highlightedElement;

            if (elementId) {
                const newElement = toJS($getEditableElement(documentState, elementId));
                if (!isEqual(newElement, highlightedElement)) {
                    setHighlightedElement(newElement);
                }
            } else {
                setHighlightedElement(null);
            }
        });
    }, [highlightedElement]);

    return highlightedElement;
};
