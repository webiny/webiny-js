import React from "react";
import { observer } from "mobx-react-lite";
import Editor from "@monaco-editor/react";
import type { PlaygroundPresenter } from "../abstractions.js";

interface ResponseEditorProps {
    presenter: PlaygroundPresenter.Interface;
}

export const ResponseEditor: React.FC<ResponseEditorProps> = observer(function ResponseEditor({
    presenter
}) {
    const activeTab = presenter.vm.activeTab;

    if (!activeTab) {
        return null;
    }

    const hasResponse = activeTab.response.length > 0;

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-white min-w-[20%]">
            <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-600">
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
const ResponseContent: React.FC<ResponseContentProps> = function ResponseContent({
    hasResponse,
    response
}) {
    if (!hasResponse) {
        return (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm italic">
                Run a query to see results
            </div>
        );
    }

    return (
        <Editor
            height="100%"
            defaultLanguage="json"
            value={response}
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
