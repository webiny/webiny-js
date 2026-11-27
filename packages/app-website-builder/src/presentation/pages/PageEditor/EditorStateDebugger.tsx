import { useEffect } from "react";
import MonacoEditor from "@monaco-editor/react";
import { Button } from "@webiny/admin-ui";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { useSelectFromDocument } from "~/BaseEditor/hooks/useSelectFromDocument.js";
import React from "react";
import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor.js";
import type { HistorySnapshot } from "~/editorSdk/HistorySnapshot.js";

const monacoOptions = { minimap: { enabled: false } };

const formatSnapshots = (snapshots: HistorySnapshot[], activeIndex: number) => {
    return snapshots
        .map((snapshot, index) => {
            const asString = JSON.stringify(snapshot.getState(), null, 2);
            const isActive = activeIndex === index;

            return `// ${isActive ? "🟢" : "⚪️"} Snapshot #${index + 1} (${snapshot
                .getCreatedOn()
                .toISOString()})\n${asString}`;
        })
        .join(",\n");
};

export const EditorStateDebugger = () => {
    const editor = useDocumentEditor();

    const editorState = useSelectFromEditor(state => state);
    const documentState = useSelectFromDocument(state => state);
    const history = editor.getDocumentState().getHistory();

    const numberOfSnapshots = editor.getDocumentState().getHistory().getSnapshots().length;

    useEffect(() => {
        // @ts-ignore 123
        window["editor"] = editor;
    }, []);

    const monacoValue = `// Editor State\n${JSON.stringify(
        editorState,
        null,
        2
    )}\n\n// Document State\n${JSON.stringify(
        documentState,
        null,
        2
    )}\n\n// History\n\n${formatSnapshots(history.getSnapshots(), history.getActiveSnapshotIndex())}
    \n// Snapshot Changes\n${JSON.stringify(history.getCurrentSnapshot().getChanges(), null, 2)}`;

    return (
        <div
            className={
                "absolute w-full pt-[5px] pl-[5px] border-t-1 border-solid border-[#cccccc] z-[10000]"
            }
        >
            <Button variant="secondary" text={`Snapshots: ${numberOfSnapshots}`}></Button>
            <MonacoEditor
                height={"100vh"}
                language={"json"}
                value={monacoValue}
                options={monacoOptions}
            />
        </div>
    );
};
