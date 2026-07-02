import React from "react";
import { useCallback } from "react";
import { observer } from "mobx-react-lite";
import Editor from "@monaco-editor/react";
import { ReactComponent as ExpandLessIcon } from "@webiny/icons/expand_less.svg";
import { ReactComponent as ExpandMoreIcon } from "@webiny/icons/expand_more.svg";
import type { PlaygroundPresenter } from "../abstractions.js";
import type { IPlaygroundBottomPanel } from "../abstractions.js";

interface BottomPanelProps {
    presenter: PlaygroundPresenter.Interface;
}

export const BottomPanel: React.FC<BottomPanelProps> = observer(function BottomPanel({
    presenter
}) {
    const activeTab = presenter.vm.activeTab;

    if (!activeTab) {
        return null;
    }

    const handleSelectPanel = useCallback(
        (panel: IPlaygroundBottomPanel) => {
            presenter.selectBottomPanel(panel);
        },
        [presenter]
    );

    const handleToggle = useCallback(() => {
        presenter.toggleBottomPanel();
    }, [presenter]);

    const handleVariablesChange = useCallback(
        (value: string | undefined) => {
            if (value !== undefined) {
                presenter.updateVariables(value);
            }
        },
        [presenter]
    );

    const handleHeadersChange = useCallback(
        (value: string | undefined) => {
            if (value !== undefined) {
                presenter.updateHeaders(value);
            }
        },
        [presenter]
    );

    return (
        <div className="flex flex-col border-t border-gray-200 bg-white">
            <div className="flex items-center justify-between px-2 bg-gray-50 border-b border-gray-200">
                <div className="flex">
                    <PanelTab
                        label="Variables"
                        panel="variables"
                        activePanel={activeTab.activeBottomPanel}
                        onSelect={handleSelectPanel}
                    />
                    <PanelTab
                        label="Headers"
                        panel="headers"
                        activePanel={activeTab.activeBottomPanel}
                        onSelect={handleSelectPanel}
                    />
                </div>
                <button
                    className="p-1 hover:bg-gray-200 rounded"
                    onClick={handleToggle}
                    title={activeTab.isBottomPanelCollapsed ? "Expand" : "Collapse"}
                >
                    <CollapseIcon isCollapsed={activeTab.isBottomPanelCollapsed} />
                </button>
            </div>
            <PanelContent
                isCollapsed={activeTab.isBottomPanelCollapsed}
                activePanel={activeTab.activeBottomPanel}
                variables={activeTab.variables}
                headers={activeTab.headers}
                onVariablesChange={handleVariablesChange}
                onHeadersChange={handleHeadersChange}
            />
        </div>
    );
});

interface PanelTabProps {
    label: string;
    panel: IPlaygroundBottomPanel;
    activePanel: IPlaygroundBottomPanel;
    onSelect: (panel: IPlaygroundBottomPanel) => void;
}

const PanelTab: React.FC<PanelTabProps> = function PanelTab({
    label,
    panel,
    activePanel,
    onSelect
}) {
    const isActive = panel === activePanel;

    return (
        <button
            className={`px-3 py-1.5 text-xs font-medium ${
                isActive
                    ? "text-blue-600 border-b-2 border-blue-500"
                    : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => onSelect(panel)}
        >
            {label}
        </button>
    );
};

interface CollapseIconProps {
    isCollapsed: boolean;
}

const CollapseIcon: React.FC<CollapseIconProps> = function CollapseIcon({ isCollapsed }) {
    if (isCollapsed) {
        return <ExpandLessIcon className="w-4 h-4 text-gray-500" />;
    }

    return <ExpandMoreIcon className="w-4 h-4 text-gray-500" />;
};

interface PanelContentProps {
    isCollapsed: boolean;
    activePanel: IPlaygroundBottomPanel;
    variables: string;
    headers: string;
    onVariablesChange: (value: string | undefined) => void;
    onHeadersChange: (value: string | undefined) => void;
}

/* Renders the editor content when the panel is expanded. */
const PanelContent: React.FC<PanelContentProps> = function PanelContent({
    isCollapsed,
    activePanel,
    variables,
    headers,
    onVariablesChange,
    onHeadersChange
}) {
    if (isCollapsed) {
        return null;
    }

    const value = activePanel === "variables" ? variables : headers;
    const onChange = activePanel === "variables" ? onVariablesChange : onHeadersChange;

    return (
        <div style={{ height: 150 }}>
            <Editor
                height="100%"
                defaultLanguage="json"
                value={value}
                onChange={onChange}
                options={{
                    minimap: { enabled: false },
                    renderLineHighlight: "none",
                    fontSize: 13,
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    tabSize: 2,
                    insertSpaces: true,
                    lineNumbers: "off",
                    folding: false
                }}
            />
        </div>
    );
};
