import { useCallback, useRef } from "react";
import type { BeforeMount, OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { typescript } from "monaco-editor";
import { SDK_GLOBAL_DECLARATION } from "./sdkGlobalDeclaration.js";
import { defaultSdkCode } from "./defaultCode.js";

export function useMonacoEditor(handleRun: () => void) {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    // Configure Monaco editor with SDK types.
    const handleBeforeMount: BeforeMount = useCallback(monaco => {
        typescript.typescriptDefaults.setCompilerOptions({
            target: typescript.ScriptTarget.ES2020,
            allowNonTsExtensions: true,
            moduleResolution: typescript.ModuleResolutionKind.NodeJs,
            module: typescript.ModuleKind.CommonJS,
            noEmit: true,
            esModuleInterop: true,
            allowJs: true
        });

        // Single addExtraLib call with a pure script-mode string (no import/export).
        // This makes TypeScript treat the file as an ambient script, so all
        // declare statements become true globals visible to user code.
        typescript.typescriptDefaults.addExtraLib(
            SDK_GLOBAL_DECLARATION,
            "file:///sdk-globals.d.ts"
        );
    }, []);

    const handleEditorDidMount: OnMount = useCallback(
        (ed, monaco) => {
            editorRef.current = ed;

            // Re-create the model with a file:/// URI so it lives in the same
            // virtual FS namespace as the addExtraLib file, giving the TS
            // language service full visibility into the ambient declarations.
            const existingModel = ed.getModel();
            const newModel = monaco.editor.createModel(
                existingModel?.getValue() ?? defaultSdkCode,
                "typescript",
                monaco.Uri.parse("file:///user-script.ts")
            );
            ed.setModel(newModel);
            existingModel?.dispose();

            ed.addAction({
                id: "run-code",
                label: "Run Code",
                keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
                run: () => {
                    void handleRun();
                }
            });
        },
        [handleRun]
    );

    const handleFormat = useCallback(() => {
        editorRef.current?.getAction("editor.action.formatDocument")?.run();
    }, []);

    return {
        editorRef,
        handleBeforeMount,
        handleEditorDidMount,
        handleFormat
    };
}
