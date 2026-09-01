import React from "react";
import { useColorScheme } from "@webiny/app-admin";
import { useCallback } from "react";
import { observer } from "mobx-react-lite";
import Editor from "@monaco-editor/react";
import type { PlaygroundPresenter } from "../abstractions.js";
import { useMonacoGraphQL } from "../hooks/useMonacoGraphQL.js";

interface QueryEditorProps {
    presenter: PlaygroundPresenter.Interface;
}

export const QueryEditor = observer((props: QueryEditorProps) => {
    // Monaco themes itself, outside CSS — without this it defaults to "vs" (light) and
    // stays a white editor on a dark page.
    const monacoTheme = useColorScheme() === "dark" ? "vs-dark" : "vs";

    const vm = props.presenter.vm;
    const activeTab = vm.activeTab;

    const { handleBeforeMount, handleEditorDidMount } = useMonacoGraphQL({
        onExecute: () => props.presenter.executeQuery(),
        schema: vm.schema
    });

    const handleQueryChange = useCallback(
        (value: string | undefined) => {
            if (value !== undefined) {
                props.presenter.updateQuery(value);
            }
        },
        [props.presenter]
    );

    const handleEndpointChange = useCallback(
        (ev: React.ChangeEvent<HTMLInputElement>) => {
            props.presenter.updateEndpoint(ev.target.value);
        },
        [props.presenter]
    );

    if (!activeTab) {
        return null;
    }

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center px-3 py-1.5 bg-neutral-subtle border-b border-neutral-dimmed">
                <span className="text-xs text-neutral-muted mr-2 shrink-0">Endpoint:</span>
                <input
                    type="text"
                    value={activeTab.endpoint}
                    onChange={handleEndpointChange}
                    readOnly={activeTab.isRegistered}
                    className={`flex-1 text-xs px-2 py-1 border border-neutral-muted rounded font-mono ${
                        activeTab.isRegistered
                            ? "bg-neutral-light text-neutral-muted cursor-default"
                            : "bg-neutral-base"
                    }`}
                />
            </div>
            <div className="flex-1 overflow-hidden">
                <Editor
                    height="100%"
                    theme={monacoTheme}
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
