/**
 * A user's admin dashboard layout: an ordered list of widget names per column (`columns[i]` is
 * column i), the widgets the user removed (`hidden`), and how many columns the user chose.
 */
export interface DashboardLayout {
    columns: string[][];
    hidden: string[];
    columnCount: number;
}

/**
 * How a layout is stored in the CMS entry. A CMS field can't hold a list of lists, so each column
 * is an object with its own list of widget names.
 */
export interface DashboardEntryValues {
    ownerId: string;
    columns: { widgets: string[] }[];
    hidden: string[];
    columnCount: number;
}
