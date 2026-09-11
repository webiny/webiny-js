import React from "react";
import { useColorScheme } from "@webiny/app-admin";
import { observer } from "mobx-react-lite";
import Editor from "@monaco-editor/react";
import type { PlaygroundPresenter } from "../abstractions.js";

interface ResponseEditorProps {
    presenter: PlaygroundPresenter.Interface;
}

export const ResponseEditor = observer((props: ResponseEditorProps) => {
    const activeTab = props.presenter.vm.activeTab;

    if (!activeTab) {
        return null;
    }

    const hasResponse = activeTab.response.length > 0;

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-neutral-base min-w-[20%]">
            <div className="px-3 py-1.5 bg-neutral-subtle border-b border-neutral-dimmed text-xs font-medium text-neutral-strong">
                Response
            </div>
            <div className="flex-1 overflow-hidden">
                <ResponseContent hasResponse={hasResponse} response={activeTab.response} />
            </div>
        </div>
    );
});

interface ResponseContentProps {
    hasResponse: boolean;
    response: string;
}

/* Shows either the editor with results or a placeholder message. */
const ResponseContent = (props: ResponseContentProps) => {
    // Monaco themes itself, outside CSS — without this it defaults to "vs" (light) and
    // stays a white editor on a dark page.
    const monacoTheme = useColorScheme() === "dark" ? "vs-dark" : "vs";

    if (!props.hasResponse) {
        return (
            <div className="flex items-center justify-center h-full text-neutral-dimmed text-sm italic">
                Run a query to see results
            </div>
        );
    }

    return (
        <Editor
            height="100%"
            theme={monacoTheme}
            defaultLanguage="json"
            value={props.response}
            options={{
                minimap: { enabled: false },
                renderLineHighlight: "none",
                fontSize: 14,
                automaticLayout: true,
                scrollBeyondLastLine: false,
                wordWrap: "on",
                readOnly: true,
                tabSize: 2
            }}
        />
    );
};
