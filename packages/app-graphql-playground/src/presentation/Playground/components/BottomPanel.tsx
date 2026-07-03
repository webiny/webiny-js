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

export const BottomPanel = observer((props: BottomPanelProps) => {
    const activeTab = props.presenter.vm.activeTab;

    if (!activeTab) {
        return null;
    }

    const handleSelectPanel = useCallback(
        (panel: IPlaygroundBottomPanel) => {
            props.presenter.selectBottomPanel(panel);
        },
        [props.presenter]
    );

    const handleToggle = useCallback(() => {
        props.presenter.toggleBottomPanel();
    }, [props.presenter]);

    const handleVariablesChange = useCallback(
        (value: string | undefined) => {
            if (value !== undefined) {
                props.presenter.updateVariables(value);
            }
        },
        [props.presenter]
    );

    const handleHeadersChange = useCallback(
        (value: string | undefined) => {
            if (value !== undefined) {
                props.presenter.updateHeaders(value);
            }
        },
        [props.presenter]
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

const PanelTab = (props: PanelTabProps) => {
    const isActive = props.panel === props.activePanel;

    return (
        <button
            className={`px-3 py-1.5 text-xs font-medium ${
                isActive
                    ? "text-blue-600 border-b-2 border-blue-500"
                    : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => props.onSelect(props.panel)}
        >
            {props.label}
        </button>
    );
};

interface CollapseIconProps {
    isCollapsed: boolean;
}

const CollapseIcon = (props: CollapseIconProps) => {
    if (props.isCollapsed) {
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
const PanelContent = (props: PanelContentProps) => {
    if (props.isCollapsed) {
        return null;
    }

    const value = props.activePanel === "variables" ? props.variables : props.headers;
    const onChange =
        props.activePanel === "variables" ? props.onVariablesChange : props.onHeadersChange;

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
