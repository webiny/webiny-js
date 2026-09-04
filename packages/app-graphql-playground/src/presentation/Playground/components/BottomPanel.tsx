import React from "react";
import { useColorScheme } from "@webiny/app-admin";
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
        <div className="flex flex-col border-t border-neutral-dimmed bg-neutral-base">
            <div className="flex items-center justify-between px-2 bg-neutral-subtle border-b border-neutral-dimmed">
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
                    className="p-1 hover:bg-neutral-dimmed rounded"
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
                    ? "text-accent-primary border-b-2 border-accent-default"
                    : "text-neutral-muted hover:text-neutral-strong"
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
        return <ExpandLessIcon className="w-4 h-4 text-neutral-muted" />;
    }

    return <ExpandMoreIcon className="w-4 h-4 text-neutral-muted" />;
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
    // Monaco themes itself, outside CSS — without this it defaults to "vs" (light) and
    // stays a white editor on a dark page.
    const monacoTheme = useColorScheme() === "dark" ? "vs-dark" : "vs";

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
                theme={monacoTheme}
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
