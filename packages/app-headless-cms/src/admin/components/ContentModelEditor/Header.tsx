import React from "react";
import { HeaderBar, SegmentedControlPrimitive } from "@webiny/admin-ui";
import { renderPlugins } from "@webiny/app/plugins/index.js";
import { ReactComponent as EditIcon } from "@webiny/icons/dashboard.svg";
import { ReactComponent as PreviewIcon } from "@webiny/icons/table_chart.svg";

const EDITOR_TABS = [
    { id: "edit", label: "Edit", value: "edit", icon: <EditIcon /> },
    { id: "preview", label: "Preview", value: "preview", icon: <PreviewIcon /> }
];

interface EditorBarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const EditorBar = ({ activeTab, onTabChange }: EditorBarProps) => {
    return (
        <HeaderBar
            data-testid={"cms-editor-top-bar"}
            start={
                <div className={"flex items-center justify-start gap-sm"}>
                    {renderPlugins("content-model-editor-default-bar-left")}
                </div>
            }
            middle={
                <SegmentedControlPrimitive
                    variant={"dimmed"}
                    items={EDITOR_TABS}
                    value={activeTab}
                    onChange={onTabChange}
                />
            }
            end={
                <div className={"flex items-center justify-end gap-xs"}>
                    {renderPlugins("content-model-editor-default-bar-right")}
                </div>
            }
        />
    );
};

export default EditorBar;
