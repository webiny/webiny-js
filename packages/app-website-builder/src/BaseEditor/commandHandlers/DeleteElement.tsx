import { useEffect } from "react";
import { useToast } from "@webiny/admin-ui";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { Commands } from "~/BaseEditor/index.js";
import { $deleteElement } from "~/editorSdk/utils/index.js";

export const DeleteElement = () => {
    const editor = useDocumentEditor();
    const toast = useToast();

    useEffect(() => {
        return editor.registerCommandHandler(Commands.DeleteElement, payload => {
            const result = $deleteElement(editor, payload.id);

            if (result?.violation) {
                toast.showWarningToast({
                    title: result.violation.message
                });
            }
        });
    }, []);

    return null;
};
