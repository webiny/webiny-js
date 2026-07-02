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
import type { PlaygroundPresenter } from "../abstractions.js";

export const PlaygroundPage: React.FC = observer(function PlaygroundPage() {
    const { presenter } = useFeature(PlaygroundPresenterFeature);
    const { splitRef, editorPct, handleDividerMouseDown } = useResizableSplit();

    useEffect(() => {
        presenter.init();
    }, [presenter]);

    return (
        <div className="flex flex-col bg-gray-100" style={{ height: "calc(100vh - 45px)" }}>
            <PlaygroundToolbar presenter={presenter} />
            <TabBar presenter={presenter} />
            <ActiveTabContent
                presenter={presenter}
                splitRef={splitRef}
                editorPct={editorPct}
                onDividerMouseDown={handleDividerMouseDown}
            />
        </div>
    );
});

interface ActiveTabContentProps {
    presenter: PlaygroundPresenter.Interface;
    splitRef: React.RefObject<HTMLDivElement>;
    editorPct: number;
    onDividerMouseDown: (e: React.MouseEvent) => void;
}

/* Renders the main split-pane content area when an active tab exists. */
const ActiveTabContent: React.FC<ActiveTabContentProps> = observer(function ActiveTabContent({
    presenter,
    splitRef,
    editorPct,
    onDividerMouseDown
}) {
    if (!presenter.vm.activeTab) {
        return null;
    }

    return (
        <div className="flex flex-1 overflow-hidden" ref={splitRef}>
            <div
                className="flex flex-col overflow-hidden border-r border-gray-200"
                style={{ flex: "none", width: `${editorPct}%` }}
                onMouseMove={e => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    e.currentTarget.style.cursor = e.clientX >= rect.right - 4 ? "col-resize" : "";
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.cursor = "";
                }}
                onMouseDown={e => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    if (e.clientX >= rect.right - 4) {
                        onDividerMouseDown(e);
                    }
                }}
            >
                <QueryEditor presenter={presenter} />
                <BottomPanel presenter={presenter} />
            </div>
            <ResponseEditor presenter={presenter} />
        </div>
    );
});
