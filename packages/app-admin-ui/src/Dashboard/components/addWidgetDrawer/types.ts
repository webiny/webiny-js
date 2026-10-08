import type React from "react";

export interface DrawerWidget {
    name: string;
    title: string;
    description?: string;
    group?: string;
    // Static stand-in shown in the drawer. Without one, the row shows a generic sketch.
    preview?: React.ReactElement;
    // Already on the dashboard, so it can't be added again.
    added: boolean;
    // Zero-based column the widget registered with, already within the current column count.
    defaultColumn: number;
}
