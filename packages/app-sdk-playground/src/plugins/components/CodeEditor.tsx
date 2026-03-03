import React from "react";
import Editor from "@monaco-editor/react";
import type { OnMount, BeforeMount } from "@monaco-editor/react";
import { CircularProgress } from "@webiny/ui/Progress";
import { MIN_PANE_PCT } from "../types.js";

interface CodeEditorProps {
    code: string;
    editorPct: number;
    isRunning: boolean;
    onCodeChange: (value: string) => void;
    onBeforeMount: BeforeMount;
    onMount: OnMount;
    onDividerMouseDown: (e: React.MouseEvent) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
    code,
    editorPct,
    isRunning,
    onCodeChange,
    onBeforeMount,
    onMount,
    onDividerMouseDown
}) => {
    return (
        <div
            className="relative overflow-hidden border-r border-gray-200"
            style={{ flex: "none", width: `${editorPct}%` }}
            onMouseMove={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.cursor = e.clientX >= rect.right - 4 ? "col-resize" : "";
            }}
            onMouseLeave={e => {
                e.currentTarget.style.cursor = "";
            }}
            onMouseDown={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                if (e.clientX >= rect.right - 4) {
                    onDividerMouseDown(e);
                }
            }}
        >
            {isRunning && <CircularProgress label="Running code..." />}
            <Editor
                height="100%"
                defaultLanguage="typescript"
                value={code}
                onChange={value => value && onCodeChange(value)}
                beforeMount={onBeforeMount}
                onMount={onMount}
                options={{
                    minimap: { enabled: false },
                    renderLineHighlight: "none",
                    fontSize: 14,
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    tabSize: 4,
                    insertSpaces: true,
                    formatOnPaste: true,
                    formatOnType: true,
                    suggest: {
                        showKeywords: true,
                        showSnippets: true
                    }
                }}
            />
        </div>
    );
};
