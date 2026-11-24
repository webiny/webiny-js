import { autorun, toJS } from "mobx";
import { useEffect, useState } from "react";
import isEqual from "lodash/isEqual.js";
import { type DocumentElement, GlobalElementId } from "@webiny/website-builder-sdk";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { $getEditableElement } from "~/editorSdk/utils/$getEditableElement.js";

/**
 * The element whose settings the sidebar edits: the selected element, or, for a placement of a global
 * component, the global's instance. Every placement shows the instance, so editing it changes them all.
 */
export const useEditedElement = () => {
    const [editedElement, setEditedElement] = useState<DocumentElement | null>(null);
    const editor = useDocumentEditor();

    useEffect(() => {
        return autorun(() => {
            const editorState = editor.getEditorState().read();
            const documentState = editor.getDocumentState().read();

            const selected = editorState.selectedElement
                ? $getEditableElement(documentState, editorState.selectedElement)
                : undefined;

            const id = selected
                ? GlobalElementId.bindingsIdOf(selected, editorState.components)
                : null;
            const newElement = id ? (toJS($getEditableElement(documentState, id)) ?? null) : null;

            if (!isEqual(newElement, editedElement)) {
                setEditedElement(newElement);
            }
        });
    }, [editedElement]);

    return editedElement;
};
