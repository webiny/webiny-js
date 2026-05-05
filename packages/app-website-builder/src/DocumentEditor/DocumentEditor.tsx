import React, { useMemo } from "react";
import type { EditorDocument, EditorOptions } from "@webiny/website-builder-sdk";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import { Editor as EditorComponent } from "~/BaseEditor/components/index.js";
import { Editor } from "~/editorSdk/Editor.js";
import { observer } from "mobx-react-lite";
import { StateInspector } from "./StateInspector.js";
import { CompositionScope } from "@webiny/react-composition";
import { DialogsProvider } from "@webiny/app-admin";
import { WbPageStatus } from "~/constants.js";

export const DocumentEditorContext = React.createContext<Editor<any> | undefined>(undefined);

export function useDocumentEditor<TDocument extends EditorDocument>() {
    const context = React.useContext(DocumentEditorContext);
    if (!context) {
        throw new Error("useDocumentEditor must be used within a <DocumentEditor /> context!");
    }
    return context as Editor<TDocument>;
}

interface DocumentEditorProps<TDocument> {
    document: TDocument;
    name: string;
    children?: React.ReactNode;
    options?: EditorOptions;
}

function BaseDocumentEditor<TDocument extends EditorDocument>({
    document,
    name,
    children,
    options
}: DocumentEditorProps<TDocument>) {
    const editor = useMemo(() => new Editor<TDocument>(document, options), [document, options]);

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
