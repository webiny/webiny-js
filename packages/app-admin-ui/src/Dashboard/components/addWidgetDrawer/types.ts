export interface DrawerWidget {
    name: string;
    title: string;
    description?: string;
    group?: string;
    // Already on the dashboard, so it can't be added again.
    added: boolean;
    // Zero-based column the widget registered with, already within the current column count.
    defaultColumn: number;
}
