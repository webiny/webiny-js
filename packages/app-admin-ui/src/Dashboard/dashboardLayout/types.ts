export type DashboardWidgetColumn = "left" | "right";

/** Default column count when a user hasn't customized their dashboard. */
export const DEFAULT_COLUMN_COUNT = 2;

/** Allowed range for the user-selectable column count. */
export const MIN_COLUMN_COUNT = 2;
export const MAX_COLUMN_COUNT = 4;

/**
 * The persisted, per-user dashboard layout: an ordered list of widget names per column
 * (`columns[i]` = column i), the widgets the user has removed (`hidden`), and how many
 * columns the user has chosen.
 */
export interface DashboardLayoutData {
    columns: string[][];
    hidden: string[];
    columnCount: number;
}
