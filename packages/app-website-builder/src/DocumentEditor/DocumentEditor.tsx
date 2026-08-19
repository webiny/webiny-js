import React, { useMemo } from "react";
import type { EditorDocument } from "@webiny/website-builder-sdk";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import { Editor as EditorComponent } from "~/BaseEditor/components/index.js";
import { Editor } from "~/editorSdk/Editor.js";
import { observer } from "mobx-react-lite";
import { StateInspector } from "./StateInspector.js";
import { CompositionScope } from "@webiny/react-composition";
import { DialogsProvider } from "@webiny/app-admin";

export const DocumentEditorContext = React.createContext<Editor<any> | undefined>(undefined);

export function useDocumentEditor<TDocument extends EditorDocument>() {
    const context = React.useContext(DocumentEditorContext);
    if (!context) {
        throw new Error("useDocumentEditor must be used within a <DocumentEditor /> context!");
    }
    return context as Editor<TDocument>;
}

interface DocumentEditorBaseProps {
    name: string;
    children?: React.ReactNode;
}

interface DocumentEditorWithDocument<TDocument> extends DocumentEditorBaseProps {
    document: TDocument;
    readOnly: boolean;
    editor?: never;
}

interface DocumentEditorWithEditor extends DocumentEditorBaseProps {
    editor: Editor<any>;
    document?: never;
    readOnly?: never;
}

type DocumentEditorProps<TDocument = any> =
    | DocumentEditorWithDocument<TDocument>
    | DocumentEditorWithEditor;

function BaseDocumentEditor<TDocument extends EditorDocument>({
    name,
    children,
    ...props
}: DocumentEditorProps<TDocument>) {
    const internalEditor = useMemo(() => {
        if ("editor" in props && props.editor) {
            return null;
        }
        return new Editor<TDocument>(props.document!, {
            isReadOnly: props.readOnly!
        });
    }, [
        "editor" in props ? props.editor : props.document,
        "editor" in props ? null : props.readOnly
    ]);

    const editor = "editor" in props && props.editor ? props.editor : internalEditor!;

    return (
        <DndProvider backend={HTML5Backend}>
            <StateInspector editor={editor} />
            <DocumentEditorContext.Provider value={editor as Editor<TDocument>}>
                <DialogsProvider>
                    {children ? <>{children}</> : null}
                    <CompositionScope name={name}>
                        <EditorComponent />
                    </CompositionScope>
                </DialogsProvider>
            </DocumentEditorContext.Provider>
        </DndProvider>
    );
}

const WithObserver = observer(BaseDocumentEditor);

export const DocumentEditor = WithObserver;
