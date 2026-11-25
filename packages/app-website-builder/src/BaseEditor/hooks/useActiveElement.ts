import { autorun, toJS } from "mobx";
import { useCallback, useEffect, useState } from "react";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import type { DocumentElement } from "@webiny/website-builder-sdk";
import { Commands } from "../commands.js";
import isEqual from "lodash/isEqual.js";
import { $getEditableElement } from "~/editorSdk/utils/$getEditableElement.js";

export const useActiveElement = () => {
    const [activeElement, setActiveElement] = useState<DocumentElement | null>(null);
    const editor = useDocumentEditor();

    useEffect(() => {
        return autorun(() => {
            const editorState = editor.getEditorState().read();
            const documentState = editor.getDocumentState().read();

            const activeElementId = editorState.selectedElement;

            if (activeElementId) {
                const newElement = toJS($getEditableElement(documentState, activeElementId));
                if (!isEqual(newElement, activeElement)) {
                    setActiveElement(newElement);
                }
            } else {
                setActiveElement(null);
            }
        });
    }, [activeElement]);

    const setActiveElementId = useCallback(
        (id: string | null) => {
            editor.executeCommand(Commands.SelectElement, { id });
        },
        [editor]
    );

    return [activeElement, setActiveElementId] as const;
};
