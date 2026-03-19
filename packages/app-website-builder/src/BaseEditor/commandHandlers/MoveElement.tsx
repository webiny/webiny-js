import { useEffect } from "react";
import { useToast } from "@webiny/admin-ui";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { Commands } from "~/BaseEditor/index.js";
import { $moveElement } from "~/editorSdk/utils/index.js";

export const MoveElement = () => {
    const toast = useToast();
    const editor = useDocumentEditor();

    useEffect(() => {
        return editor.registerCommandHandler(Commands.MoveElement, payload => {
            const components = editor.getEditorState().read().components;
            editor.updateDocument(document => {
                const result = $moveElement(document, { ...payload, components });
                if (result?.violation) {
                    toast.showWarningToast({
                        title: result.violation.message
                    });
                }
            });
        });
    }, []);

    return null;
};
