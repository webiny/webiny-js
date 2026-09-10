import { useEffect } from "react";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { Commands } from "~/BaseEditor/index.js";
import { $cloneElement } from "~/editorSdk/utils/index.js";

export const CloneElement = () => {
    const editor = useDocumentEditor();

    useEffect(() => {
        return editor.registerCommandHandler(Commands.CloneElement, payload => {
            const newId = $cloneElement(editor, payload.id);
            if (newId) {
                editor.executeCommand(Commands.SelectElement, { id: newId });
            }
        });
    }, []);

    return null;
};
