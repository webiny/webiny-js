import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useDocumentEditor } from "~/DocumentEditor/DocumentEditor.js";
import { useSelectFromDocument } from "~/BaseEditor/hooks/useSelectFromDocument.js";
import { WbPageStatus } from "~/constants.js";
import type { EditorPage } from "@webiny/website-builder-sdk";

export const PageEditorMode = observer(() => {
    const editor = useDocumentEditor();
    const status = useSelectFromDocument<string, EditorPage>(document => document.status);

    useEffect(() => {
        editor.updateEditor(state => {
            state.isReadOnly = status !== WbPageStatus.Draft;
        });
    }, [status]);

    return null;
});
