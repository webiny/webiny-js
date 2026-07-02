import React from "react";
import { useCallback } from "react";
import { observer } from "mobx-react-lite";
import Editor from "@monaco-editor/react";
import type { PlaygroundPresenter } from "../abstractions.js";
import { useMonacoGraphQL } from "../hooks/useMonacoGraphQL.js";

interface QueryEditorProps {
    presenter: PlaygroundPresenter.Interface;
}

export const QueryEditor: React.FC<QueryEditorProps> = observer(function QueryEditor({
    presenter
}) {
    const vm = presenter.vm;
    const activeTab = vm.activeTab;

    const { handleBeforeMount, handleEditorDidMount } = useMonacoGraphQL({
        onExecute: () => presenter.executeQuery(),
        schema: vm.schema
    });

    const handleQueryChange = useCallback(
        (value: string | undefined) => {
            if (value !== undefined) {
                presenter.updateQuery(value);
            }
        },
        [presenter]
    );

    const handleEndpointChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            presenter.updateEndpoint(e.target.value);
        },
        [presenter]
    );

    if (!activeTab) {
        return null;
    }

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center px-3 py-1.5 bg-gray-50 border-b border-gray-200">
                <span className="text-xs text-gray-500 mr-2 shrink-0">Endpoint:</span>
                <input
                    type="text"
                    value={activeTab.endpoint}
                    onChange={handleEndpointChange}
                    className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded bg-white font-mono"
                />
            </div>
            <div className="flex-1 overflow-hidden">
                <Editor
                    height="100%"
                    defaultLanguage="graphql"
                    value={activeTab.query}
                    onChange={handleQueryChange}
                    beforeMount={handleBeforeMount}
                    onMount={handleEditorDidMount}
                    options={{
                        minimap: { enabled: false },
                        renderLineHighlight: "none",
                        fontSize: 14,
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        wordWrap: "on",
                        tabSize: 2,
                        insertSpaces: true
                    }}
                />
            </div>
        </div>
    );
});
