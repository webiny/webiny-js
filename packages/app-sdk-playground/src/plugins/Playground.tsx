import React, { useState } from "react";
import { defaultSdkCode } from "./defaultCode.js";
import { useCodeExecution } from "./useCodeExecution.js";
import { useMonacoEditor } from "./useMonacoEditor.js";
import { useResizableSplit } from "./useResizableSplit.js";
import { PlaygroundToolbar } from "./components/PlaygroundToolbar.js";
import { CodeEditor } from "./components/CodeEditor.js";
import { OutputPanel } from "./components/OutputPanel.js";

const Playground: React.FC = () => {
    const [code, setCode] = useState(defaultSdkCode);
    const { splitRef, editorPct, handleDividerMouseDown } = useResizableSplit();
    const { editorRef, handleBeforeMount, handleEditorDidMount, handleFormat } = useMonacoEditor(
        () => handleRun()
    );
    const { output, isRunning, handleRun } = useCodeExecution(code, editorRef);

    return (
        <div className="flex flex-col bg-gray-100" style={{ height: "calc(100vh - 45px)" }}>
            <PlaygroundToolbar isRunning={isRunning} onRun={handleRun} onFormat={handleFormat} />
            <div className="flex flex-1 overflow-hidden" ref={splitRef}>
                <CodeEditor
                    code={code}
                    editorPct={editorPct}
                    isRunning={isRunning}
                    onCodeChange={setCode}
                    onBeforeMount={handleBeforeMount}
                    onMount={handleEditorDidMount}
                    onDividerMouseDown={handleDividerMouseDown}
                />
                <OutputPanel output={output} />
            </div>
        </div>
    );
};

export default Playground;
