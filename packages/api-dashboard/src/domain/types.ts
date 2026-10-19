/**
 * A user's admin dashboard layout: an ordered list of widget names per column (`columns[i]` is
 * column i), the widgets the user removed (`hidden`), and how many columns the user chose.
 */
export interface DashboardLayout {
    columns: string[][];
    hidden: string[];
    columnCount: number;
}
