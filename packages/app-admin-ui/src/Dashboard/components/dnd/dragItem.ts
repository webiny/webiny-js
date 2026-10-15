export const DASHBOARD_WIDGET_DND_TYPE = "dashboard-widget";

// What a dragged widget carries, so any column can size and label the slot it would drop into.
export interface DashboardWidgetDragItem {
    name: string;
    title: string;
    // The card's height when the drag started, in pixels.
    height: number;
}
