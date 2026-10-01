import { createAbstraction } from "@webiny/feature/admin";
import type { DashboardLayoutData } from "../types.js";

/**
 * Minimal description of a registered widget the presenter needs to order it.
 * The actual React element is kept in the view — the presenter deals only in names.
 * `column` is the widget's default column index.
 */
export interface DashboardWidgetInput {
    name: string;
    column: number;
}

/**
 * Where a dragged widget would be dropped: into column `column`, immediately before `beforeName`.
 * `beforeName === null` means "append to the end of the column".
 */
export interface DashboardDropTarget {
    column: number;
    beforeName: string | null;
}

export interface IDashboardLayoutViewModel {
    loading: boolean;
    columns: string[][];
    columnCount: number;
    hidden: string[];
    draggingName: string | null;
    dropTarget: DashboardDropTarget | null;
    // Customize mode: widgets can be moved, added and removed only while this is on.
    editing: boolean;
}

export interface IDashboardLayoutPresenter {
    vm: IDashboardLayoutViewModel;
    init(
        userId: string,
        widgets: DashboardWidgetInput[],
        savedLayout: DashboardLayoutData | null
    ): void;
    beginDrag(name: string): void;
    hoverSlot(column: number, beforeName: string | null): void;
    drop(): void;
    endDrag(): void;
    removeWidget(name: string): void;
    // Appends the widget to `column`, or to its default column when none is given.
    addWidget(name: string, column?: number): void;
    setColumnCount(count: number): void;
    removeColumn(index: number): void;
    resetToDefault(): void;
    startEditing(): void;
    stopEditing(): void;
    // Called when the dashboard unmounts. Resets per-visit state such as Customize mode.
    dispose(): void;
}

export const DashboardLayoutPresenter = createAbstraction<IDashboardLayoutPresenter>(
    "DashboardLayoutPresenter"
);

export namespace DashboardLayoutPresenter {
    export type Interface = IDashboardLayoutPresenter;
    export type ViewModel = IDashboardLayoutViewModel;
}
