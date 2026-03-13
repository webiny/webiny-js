import { useEffect } from "react";
import { useToast } from "@webiny/admin-ui";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { Commands } from "~/BaseEditor/index.js";
import { $createElement } from "~/editorSdk/utils/index.js";

export const CreateElement = () => {
    const editor = useDocumentEditor();
    const toast = useToast();

    useEffect(() => {
        return editor.registerCommandHandler(Commands.CreateElement, payload => {
            const result = $createElement(editor, payload);
            if (result) {
                const description = result.violations
                    .map(violation => {
                        return violation.message;
                    })
                    .join("\n");

                toast.showWarningToast({
                    title: description
                });
            }
        });
    }, []);

    return null;
};
