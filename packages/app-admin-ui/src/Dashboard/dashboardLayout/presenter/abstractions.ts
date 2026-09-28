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
    // True while the pointer is over the "drop here to create a new column" zone.
    dropNewColumn: boolean;
    // Whether a new column can still be created (below the max).
    canAddColumn: boolean;
}

export interface IDashboardLayoutPresenter {
    vm: IDashboardLayoutViewModel;
    init(widgets: DashboardWidgetInput[], savedLayout: DashboardLayoutData | null): void;
    beginDrag(name: string): void;
    hoverSlot(column: number, beforeName: string | null): void;
    hoverNewColumn(): void;
    drop(): void;
    endDrag(): void;
    removeWidget(name: string): void;
    addWidget(name: string): void;
    setColumnCount(count: number): void;
    removeColumn(index: number): void;
    resetToDefault(): void;
}

export const DashboardLayoutPresenter = createAbstraction<IDashboardLayoutPresenter>(
    "DashboardLayoutPresenter"
);

export namespace DashboardLayoutPresenter {
    export type Interface = IDashboardLayoutPresenter;
    export type ViewModel = IDashboardLayoutViewModel;
}
