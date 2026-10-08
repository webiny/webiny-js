import React from "react";
import { DashboardDragLayer } from "../dnd/DashboardDragLayer.js";
import { DashboardWidgetColumn } from "../dnd/DashboardWidgetColumn.js";
import { MIN_COLUMN_COUNT } from "../../dashboardLayout/types.js";
import type { DashboardLayoutPresenter } from "../../dashboardLayout/presenter/abstractions.js";
import { DASHBOARD_MAX_WIDTH } from "./layoutConstants.js";

interface EditableColumnsProps {
    vm: DashboardLayoutPresenter.ViewModel;
    slots: Map<string, React.ReactElement>;
    titles: Map<string, { title: string }>;
    presenter: DashboardLayoutPresenter.Interface;
    onBrowseWidgets: () => void;
}

// Customize mode: every column is a drop target and every widget can be dragged or removed.
export const EditableColumns = ({
    vm,
    slots,
    titles,
    presenter,
    onBrowseWidgets
}: EditableColumnsProps) => {
    return (
        <>
            <DashboardDragLayer />
            <div className={"flex gap-lg"} style={{ maxWidth: DASHBOARD_MAX_WIDTH }}>
                {vm.columns.map((names, index) => (
                    <DashboardWidgetColumn
                        key={index}
                        columnIndex={index}
                        names={names}
                        draggingName={vm.draggingName}
                        dropTarget={vm.dropTarget}
                        canRemoveColumn={vm.columnCount > MIN_COLUMN_COUNT}
                        elements={slots}
                        titles={titles}
                        presenter={presenter}
                        onBrowseWidgets={onBrowseWidgets}
                    />
                ))}
            </div>
        </>
    );
};
