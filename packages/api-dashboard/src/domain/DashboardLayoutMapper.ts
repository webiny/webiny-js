import type { DashboardEntryValues } from "./types.js";
import type { DashboardLayout } from "./types.js";

export class DashboardLayoutMapper {
    static toLayout(values: DashboardEntryValues): DashboardLayout {
        return {
            columns: (values.columns ?? []).map(column => column.widgets ?? []),
            hidden: values.hidden ?? [],
            columnCount: values.columnCount
        };
    }

    static toEntryValues(ownerId: string, layout: DashboardLayout): DashboardEntryValues {
        return {
            ownerId,
            columns: layout.columns.map(widgets => ({ widgets })),
            hidden: layout.hidden,
            columnCount: layout.columnCount
        };
    }
}
