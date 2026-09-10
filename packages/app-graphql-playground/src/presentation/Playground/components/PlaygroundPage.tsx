import React from "react";
import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app/shared/di/useFeature.js";
import { PlaygroundPresenterFeature } from "../feature.js";
import { useResizableSplit } from "../hooks/useResizableSplit.js";
import { PlaygroundToolbar } from "./PlaygroundToolbar.js";
import { TabBar } from "./TabBar.js";
import { QueryEditor } from "./QueryEditor.js";
import { ResponseEditor } from "./ResponseEditor.js";
import { BottomPanel } from "./BottomPanel.js";
import { DocsExplorerFeature } from "../../DocsExplorer/feature.js";
import { DocsExplorerDrawer } from "../../DocsExplorer/components/DocsExplorerDrawer.js";
import { QueryHistoryFeature } from "../../QueryHistory/feature.js";
import { QueryHistoryDrawer } from "../../QueryHistory/components/QueryHistoryDrawer.js";
import type { PlaygroundPresenter } from "../abstractions.js";

export const PlaygroundPage = observer(() => {
    const { presenter } = useFeature(PlaygroundPresenterFeature);
    const { presenter: docsPresenter } = useFeature(DocsExplorerFeature);
    const { presenter: historyPresenter } = useFeature(QueryHistoryFeature);
    const { splitRef, editorPct, handleDividerMouseDown } = useResizableSplit();

    useEffect(() => {
        presenter.init();
    }, [presenter]);

    useEffect(() => {
        const schema = presenter.vm.schema;
        const status = presenter.vm.schemaStatus;
        docsPresenter.setSchema(schema, status);
    }, [presenter.vm.schema, presenter.vm.schemaStatus, docsPresenter]);

    useEffect(() => {
        historyPresenter.load();
    }, [historyPresenter]);

    useEffect(() => {
        const activeTab = presenter.vm.activeTab;
        if (activeTab && !activeTab.isExecuting) {
            historyPresenter.refresh();
        }
    }, [presenter.vm.activeTab?.isExecuting, historyPresenter]);

    return (
        <div className="flex flex-col bg-gray-100" style={{ height: "calc(100vh - 45px)" }}>
            <PlaygroundToolbar
                presenter={presenter}
                docsPresenter={docsPresenter}
                historyPresenter={historyPresenter}
            />
            <TabBar presenter={presenter} />
            <ActiveTabContent
                presenter={presenter}
                splitRef={splitRef}
                editorPct={editorPct}
                onDividerMouseDown={handleDividerMouseDown}
            />
            <DocsExplorerDrawer presenter={docsPresenter} />
            <QueryHistoryDrawer presenter={historyPresenter} playgroundPresenter={presenter} />
        </div>
    );
});

interface ActiveTabContentProps {
    presenter: PlaygroundPresenter.Interface;
    splitRef: React.RefObject<HTMLDivElement>;
    editorPct: number;
    onDividerMouseDown: (ev: React.MouseEvent) => void;
}

/* Renders the main split-pane content area when an active tab exists. */
const ActiveTabContent = observer((props: ActiveTabContentProps) => {
    if (!props.presenter.vm.activeTab) {
        return null;
    }

    return (
        <div className="flex flex-1 overflow-hidden" ref={props.splitRef}>
            <div
                className="flex flex-col overflow-hidden border-r border-gray-200"
                style={{ flex: "none", width: `${props.editorPct}%` }}
                onMouseMove={ev => {
                    const rect = ev.currentTarget.getBoundingClientRect();
                    ev.currentTarget.style.cursor =
                        ev.clientX >= rect.right - 4 ? "col-resize" : "";
                }}
                onMouseLeave={ev => {
                    ev.currentTarget.style.cursor = "";
                }}
                onMouseDown={ev => {
                    const rect = ev.currentTarget.getBoundingClientRect();
                    if (ev.clientX >= rect.right - 4) {
                        props.onDividerMouseDown(ev);
                    }
                }}
            >
                <QueryEditor presenter={props.presenter} />
                <BottomPanel presenter={props.presenter} />
            </div>
            <ResponseEditor presenter={props.presenter} />
        </div>
    );
});
