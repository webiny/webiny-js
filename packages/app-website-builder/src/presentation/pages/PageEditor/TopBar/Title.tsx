import React, { useCallback } from "react";
import { EditableTitle } from "@webiny/admin-ui";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { useSelectFromDocument } from "~/BaseEditor/hooks/useSelectFromDocument.js";
import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor.js";
import { LanguageCodeTag } from "~/presentation/components/LanguageCodeTag.js";

export function Title() {
    const isEditorReadOnly = useSelectFromEditor(state => state.isReadOnly);
    const editor = useDocumentEditor();

    const { title, language } = useSelectFromDocument(document => {
        return {
            title: document.properties.title ?? "Untitled",
            language: document.properties.language ?? undefined
        };
    });

    const commitValue = useCallback((value: string) => {
        editor.updateDocument(document => {
            document.properties.title = value;
        });
    }, []);

    return (
        <EditableTitle
            value={title}
            onCommit={commitValue}
            readOnly={isEditorReadOnly}
            startContent={<LanguageCodeTag code={language} />}
        />
    );
}
