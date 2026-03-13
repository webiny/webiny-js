import { useEffect } from "react";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { Commands } from "~/BaseEditor/index.js";
import { $moveElement } from "~/editorSdk/utils/index.js";

export const MoveElement = () => {
    const editor = useDocumentEditor();
    useEffect(() => {
        return editor.registerCommandHandler(Commands.MoveElement, payload => {
            const components = editor.getEditorState().read().components;
            editor.updateDocument(document => {
                $moveElement(document, { ...payload, components });
            });
        });
    }, []);

    return null;
};
